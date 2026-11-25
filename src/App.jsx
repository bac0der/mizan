import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getCachedPrayerTimes, syncMonthlyPrayerTimes } from './engines/prayerEngine';
import { buildDailyAutopilotBlocks } from './engines/autopilotEngine';
import { parseStudyOSBackup, pruneExpiredTasks } from './engines/studySync';
import { getTodayKey } from './utils/timeUtils';
import { soundEngine } from './utils/soundEngine';
import {
  requestNotificationPermission,
  updateNotificationHud,
  sendHourlyDeadlineAlert,
  clearNotificationHud
} from './utils/notificationHud';

import AutopilotCard from './components/AutopilotCard';
import SocialGateTimer from './components/SocialGateTimer';
import SpeechControl from './components/SpeechControl';
import TimelineView from './components/TimelineView';
import SettingsPanel from './components/SettingsPanel';
import BottomNav from './components/BottomNav';

export default function App() {
  const [activeTab, setActiveTab] = useState('autopilot');
  const [darkMode, setDarkMode] = useLocalStorage('mizan_dark', false);
  const [now, setNow] = useState(new Date());

  // 2-B: Joriy hafta (23-noyabr 2026 dushanba boshlangan hafta) = TOQ hafta sifatida tayanch qilindi
  const [settings, setSettings] = useLocalStorage('mizan_settings_v2', {
    city: 'Tashkent',
    anchorMondayISO: '2026-11-23',
    anchorParity: 'toq',
    autoSleepFromFajr: true,
    sleepCycles: 5,
    wakeTime: '05:40',
    bedTime: '22:00',
    uniStart: '13:00',
    uniEnd: '17:20',
    commuteMins: 10,
    socialLimitMins: 30,
    hudEnabled: false
  });

  const [syncedClasses, setSyncedClasses] = useLocalStorage('mizan_classes', []);
  const [syncedTasks, setSyncedTasks] = useLocalStorage('mizan_tasks', []);

  // Oxirgi 3 kunlik tarix (deadline yuklangandan keyingi 3 kunlik tekshiruv/baho oynasiga mos)
  const [recentHistory, setRecentHistory] = useLocalStorage('mizan_history_3d', []);

  const todayKey = getTodayKey(now);
  const [dailyState, setDailyState] = useLocalStorage('mizan_daily_state_v2', {
    date: todayKey,
    socialSeconds: 0,
    researchBonusGranted: false,
    treatSelfMode: false,
    delayMins: 0,
    waterGlasses: 0,
    completedBlockIds: [],
    speech: { good: 0, slips: { anger: 0, gossip: 0, debate: 0, complaint: 0 } },
    reflection: '',
    sleepQuality: null
  });

  const [socialRunning, setSocialRunning] = useState(false);
  const [lowEnergyMode, setLowEnergyMode] = useState(false);
  const [prayerState, setPrayerState] = useState(() => getCachedPrayerTimes(settings.city, new Date()));
  const [syncingPrayers, setSyncingPrayers] = useState(false);
  const [toast, setToast] = useState(null);

  const prevBlockIdRef = useRef(null);
  const hydrationPingedRef = useRef(false);
  const lastHourlyAlertKeyRef = useRef('');

  const notify = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Yangi kun boshlanganda: eski kunni 3 kunlik tarixga o'tkazish va 3 kundan eskilarini tozalash
  useEffect(() => {
    if (dailyState.date !== todayKey) {
      setRecentHistory((prev) => {
        const archived = [
          {
            date: dailyState.date,
            speech: dailyState.speech,
            reflection: dailyState.reflection,
            waterGlasses: dailyState.waterGlasses,
            completedCount: (dailyState.completedBlockIds || []).length
          },
          ...prev.filter((item) => item.date !== dailyState.date)
        ];
        return archived.slice(0, 3);
      });

      setSyncedTasks((prev) => pruneExpiredTasks(prev, now));

      setDailyState({
        date: todayKey,
        socialSeconds: 0,
        researchBonusGranted: false,
        treatSelfMode: false,
        delayMins: 0,
        waterGlasses: 0,
        completedBlockIds: [],
        speech: { good: 0, slips: { anger: 0, gossip: 0, debate: 0, complaint: 0 } },
        reflection: '',
        sleepQuality: null
      });
      setLowEnergyMode(false);
      setSocialRunning(false);
    }
  }, [todayKey, dailyState, now, setDailyState, setRecentHistory, setSyncedTasks]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const handleSyncPrayers = async (silent = false) => {
    setSyncingPrayers(true);
    try {
      const fresh = await syncMonthlyPrayerTimes(settings.city, 'Uzbekistan');
      setPrayerState({ timings: fresh, source: 'cache' });
      if (!silent) notify(`${settings.city} namoz vaqtlari yangilandi!`, 'success');
    } catch {
      const cached = getCachedPrayerTimes(settings.city, new Date());
      setPrayerState(cached);
      if (!silent) notify('Offline rejim: keshlangan namoz vaqtlari ishlatilmoqda.', 'info');
    } finally {
      setSyncingPrayers(false);
    }
  };

  useEffect(() => {
    handleSyncPrayers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.city]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const autopilot = useMemo(
    () =>
      buildDailyAutopilotBlocks({
        now,
        prayerTimes: prayerState.timings,
        classes: syncedClasses,
        tasks: syncedTasks,
        settings,
        treatSelfMode: dailyState.treatSelfMode,
        delayMins: dailyState.delayMins || 0
      }),
    [
      now,
      prayerState.timings,
      syncedClasses,
      syncedTasks,
      settings,
      dailyState.treatSelfMode,
      dailyState.delayMins
    ]
  );

  // Muddat tugashiga 3 kun qolganda har soatda bildirishnoma yuborish (uyqu vaqtidan tashqari)
  useEffect(() => {
    if (!settings.hudEnabled) return;
    if (!autopilot.urgent3DayTasks || autopilot.urgent3DayTasks.length === 0) return;
    if (autopilot.currentBlock?.id === 'blk-sleep') return;

    const hourStamp = `${todayKey}-${now.getHours()}`;
    if (lastHourlyAlertKeyRef.current === hourStamp) return;

    lastHourlyAlertKeyRef.current = hourStamp;
    const topUrgent = autopilot.urgent3DayTasks[0];
    const hoursLeft = Math.max(1, topUrgent.daysLeft * 24 + (23 - now.getHours()));
    sendHourlyDeadlineAlert({ task: topUrgent, hoursLeft });
  }, [settings.hudEnabled, autopilot.urgent3DayTasks, autopilot.currentBlock?.id, todayKey, now]);

  const completedBlockIds = dailyState.completedBlockIds || [];

  const toggleBlockDone = useCallback(
    (blockId) => {
      setDailyState((prev) => {
        const list = prev.completedBlockIds || [];
        const exists = list.includes(blockId);
        return {
          ...prev,
          completedBlockIds: exists ? list.filter((id) => id !== blockId) : [...list, blockId]
        };
      });
    },
    [setDailyState]
  );

  const effectiveLimitMins = settings.socialLimitMins + (dailyState.researchBonusGranted ? 10 : 0);
  const socialRemainingSecs = Math.max(0, effectiveLimitMins * 60 - dailyState.socialSeconds);

  useEffect(() => {
    if (!settings.hudEnabled) return;
    updateNotificationHud({
      enabled: settings.hudEnabled,
      currentBlock: autopilot.currentBlock,
      nextBlock: autopilot.nextBlock,
      minsRemaining: autopilot.minsRemaining,
      socialRemainingSecs,
      socialRunning,
      isDone: completedBlockIds.includes(autopilot.currentBlock?.id),
      urgentTask: autopilot.urgent3DayTasks?.[0] || null
    });
  }, [
    settings.hudEnabled,
    autopilot.currentBlock,
    autopilot.nextBlock,
    autopilot.minsRemaining,
    autopilot.urgent3DayTasks,
    socialRemainingSecs,
    socialRunning,
    completedBlockIds
  ]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event) => {
      if (event.data?.type !== 'MIZAN_NOTIFICATION_ACTION') return;
      const action = event.data.action;
      if (action === 'toggle-done' && autopilot.currentBlock?.id) {
        toggleBlockDone(autopilot.currentBlock.id);
      } else if (action === 'toggle-ig') {
        if (!autopilot.windDown && socialRemainingSecs > 0) {
          setSocialRunning((r) => !r);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [autopilot.currentBlock?.id, autopilot.windDown, socialRemainingSecs, toggleBlockDone]);

  const handleToggleHud = async () => {
    if (settings.hudEnabled) {
      setSettings((s) => ({ ...s, hudEnabled: false }));
      await clearNotificationHud();
      notify('Notification HUD o‘chirildi.', 'info');
      return;
    }

    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setSettings((s) => ({ ...s, hudEnabled: true }));
      notify('Notification HUD va soatma-soat deadline eslatmasi yoqildi!', 'success');
    } else if (perm === 'unsupported') {
      notify('Ushbu brauzer bildirishnomalarni qo‘llab-quvvatlamaydi.', 'warning');
    } else {
      notify('Brauzer sozlamalaridan bildirishnomaga ruxsat bering.', 'warning');
    }
  };

  useEffect(() => {
    const currId = autopilot.currentBlock?.id;
    if (prevBlockIdRef.current && currId && prevBlockIdRef.current !== currId) {
      soundEngine.playTransitionChime();
    }
    prevBlockIdRef.current = currId;
  }, [autopilot.currentBlock?.id]);

  useEffect(() => {
    if (autopilot.isHydrationMoment && !hydrationPingedRef.current) {
      hydrationPingedRef.current = true;
      soundEngine.playHydrationPing();
    } else if (!autopilot.isHydrationMoment) {
      hydrationPingedRef.current = false;
    }
  }, [autopilot.isHydrationMoment]);

  const handleImportStudyOS = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const res = parseStudyOSBackup(parsed);
        if (!res.valid) {
          notify(res.error, 'warning');
          return;
        }
        setSyncedClasses(res.classes);
        setSyncedTasks(pruneExpiredTasks(res.tasks, now));
        notify(`${res.classes.length} ta dars va ${res.tasks.length} ta vazifa ulandi!`, 'success');
      } catch {
        notify('JSON faylni o‘qib bo‘lmadi.', 'warning');
      }
    };
    reader.readAsText(file);
  };

  const handleExportMizan = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            app: 'mizan-autopilot-pwa',
            version: '2.2.0',
            exportedAt: new Date().toISOString(),
            settings,
            syncedClasses,
            syncedTasks,
            dailyState,
            recentHistory
          },
          null,
          2
        )
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mizan-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Mizan zaxira nusxasi yuklab olindi!', 'success');
  };

  const timeFormatted = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      <header className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Mizan • {autopilot.weekParity === 'toq' ? 'Toq hafta' : 'Juft hafta'}
            </span>
            <p className="text-xs text-slate-500">
              {settings.city} • Bomdod {prayerState.timings.Fajr} • Uyg‘onish {autopilot.autoSleep.wakeTime}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold tabular-nums">{timeFormatted}</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-5">
        {activeTab === 'autopilot' && (
          <>
            <AutopilotCard
              autopilot={autopilot}
              lowEnergyMode={lowEnergyMode}
              setLowEnergyMode={setLowEnergyMode}
              treatSelfMode={dailyState.treatSelfMode}
              setTreatSelfMode={(val) =>
                setDailyState((prev) => ({ ...prev, treatSelfMode: val }))
              }
              delayMins={dailyState.delayMins || 0}
              onAddDelay={() => {
                setDailyState((prev) => ({ ...prev, delayMins: (prev.delayMins || 0) + 15 }));
                notify('+15 daq kechikish qo‘shildi (uyqu vaqti o‘zgarmaydi).', 'info');
              }}
              onResetDelay={() =>
                setDailyState((prev) => ({ ...prev, delayMins: 0 }))
              }
              sleepQuality={dailyState.sleepQuality}
              setSleepQuality={(q) => setDailyState((prev) => ({ ...prev, sleepQuality: q }))}
              waterGlasses={dailyState.waterGlasses || 0}
              setWaterGlasses={(updater) =>
                setDailyState((prev) => ({
                  ...prev,
                  waterGlasses:
                    typeof updater === 'function' ? updater(prev.waterGlasses || 0) : updater
                }))
              }
              completedBlockIds={completedBlockIds}
              onToggleDone={toggleBlockDone}
              hudEnabled={settings.hudEnabled}
              onToggleHud={handleToggleHud}
              now={now}
            />
            <SocialGateTimer
              allowSocialNow={autopilot.currentBlock?.allowSocial}
              windDown={autopilot.windDown}
              baseLimitMins={settings.socialLimitMins}
              researchBonusGranted={dailyState.researchBonusGranted}
              onGrantResearchBonus={() => {
                setDailyState((prev) => ({ ...prev, researchBonusGranted: true }));
                notify('Izlanish uchun +10 daqiqa qo‘shildi (jami 40 daqiqa)', 'info');
              }}
              usedSecondsToday={dailyState.socialSeconds}
              setUsedSecondsToday={(updater) =>
                setDailyState((prev) => ({
                  ...prev,
                  socialSeconds:
                    typeof updater === 'function' ? updater(prev.socialSeconds) : updater
                }))
              }
              isRunning={socialRunning}
              setIsRunning={setSocialRunning}
              notify={notify}
            />
          </>
        )}

        {activeTab === 'speech' && (
          <SpeechControl
            speechStats={dailyState.speech}
            setSpeechStats={(updater) =>
              setDailyState((prev) => ({
                ...prev,
                speech: typeof updater === 'function' ? updater(prev.speech) : updater
              }))
            }
            eveningReflection={dailyState.reflection}
            setEveningReflection={(text) =>
              setDailyState((prev) => ({ ...prev, reflection: text }))
            }
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            prayerTimes={prayerState.timings}
            prayerSource={prayerState.source}
            blocks={autopilot.blocks}
            weekParity={autopilot.weekParity}
            currentBlockId={autopilot.currentBlock?.id}
            onSyncPrayers={() => handleSyncPrayers(false)}
            syncing={syncingPrayers}
            now={now}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            weekParity={autopilot.weekParity}
            autoSleep={autopilot.autoSleep}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            syncedClassesCount={syncedClasses.length}
            syncedTasksCount={syncedTasks.length}
            historyCount={recentHistory.length}
            onImportStudyOS={handleImportStudyOS}
            onExportMizan={handleExportMizan}
            now={now}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {toast && (
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl text-center">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
