import React, { useEffect } from 'react';
import { ShieldAlert, Play, Pause, RotateCcw, Lock, Unlock, Search } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export default function SocialGateTimer({
  allowSocialNow,
  windDown,
  baseLimitMins = 30,
  researchBonusGranted,
  onGrantResearchBonus,
  usedSecondsToday,
  setUsedSecondsToday,
  isRunning,
  setIsRunning,
  notify
}) {
  const effectiveLimitMins = baseLimitMins + (researchBonusGranted ? 10 : 0);
  const totalAllowedSecs = effectiveLimitMins * 60;
  const remainingSecs = Math.max(0, totalAllowedSecs - usedSecondsToday);
  const isQuotaExhausted = remainingSecs === 0;

  useEffect(() => {
    if (!isRunning) return;
    if (windDown || isQuotaExhausted) {
      setIsRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setUsedSecondsToday((prev) => {
        const next = prev + 1;
        if (next >= totalAllowedSecs) {
          setIsRunning(false);
          soundEngine.playSocialLimitAlert();
          notify('Ijtimoiy tarmoq limiti (30+10 daq) tugadi! Telefonni yoping.', 'warning');
          return totalAllowedSecs;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, setIsRunning, windDown, isQuotaExhausted, totalAllowedSecs, setUsedSecondsToday, notify]);

  const mins = String(Math.floor(remainingSecs / 60)).padStart(2, '0');
  const secs = String(remainingSecs % 60).padStart(2, '0');

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            {windDown || isQuotaExhausted ? (
              <Lock className="w-3.5 h-3.5 text-rose-500" />
            ) : allowSocialNow ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            )}
            Ijtimoiy Tarmoq (30 daq + 10 daq izlanish)
          </span>
          <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
            Qolgan Vaqt:{' '}
            <span className="tabular-nums text-teal-600 dark:text-teal-400">
              {mins}:{secs}
            </span>{' '}
            <span className="text-xs font-normal text-slate-400">/ {effectiveLimitMins} daq</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {windDown
              ? 'Wind-Down vaqti: uyqu oldidan ijtimoiy tarmoqlar yopiq.'
              : isQuotaExhausted
              ? 'Bugungi limit tugadi. Ertaga Bomdoddan keyin yangilanadi.'
              : allowSocialNow
              ? 'Ruxsat oynasi ochiq — kirishdan oldin taymerni yoqing.'
              : 'Hozir fokus/ibodat vaqti. Faqat ma’lumot izlash uchun kiring.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={windDown || isQuotaExhausted}
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
              windDown || isQuotaExhausted
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : isRunning
                ? 'bg-rose-600 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pauza' : 'Taymer'}
          </button>

          {usedSecondsToday > 0 && !isRunning && (
            <button
              onClick={() => setUsedSecondsToday(0)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 cursor-pointer"
              title="Taymerni nolga qaytarish"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!researchBonusGranted && !windDown && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">
            Ma’lumot izlash kerakmi? (+10 daqiqa qo‘shimcha limit)
          </span>
          <button
            onClick={onGrantResearchBonus}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 text-xs font-extrabold hover:bg-indigo-100 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" /> +10 daq izlanish
          </button>
        </div>
      )}
    </div>
  );
}
