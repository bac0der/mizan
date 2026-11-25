import React from 'react';
import {
  Compass,
  Clock,
  ArrowRight,
  BatteryLow,
  Sparkles,
  MoonStar,
  CheckCircle2,
  UtensilsCrossed,
  Droplets,
  Building2,
  BellRing,
  BellOff,
  TimerReset,
  AlertCircle
} from 'lucide-react';
import { minutesToTime, formatRemaining } from '../utils/timeUtils';

const CATEGORY_STYLES = {
  ibodat: 'from-teal-700 to-emerald-600 shadow-teal-600/20',
  oqish: 'from-indigo-700 to-sky-600 shadow-indigo-600/20',
  ish: 'from-violet-700 to-purple-600 shadow-violet-600/20',
  ovqat: 'from-amber-600 to-orange-500 shadow-amber-600/20',
  oila: 'from-rose-600 to-pink-500 shadow-rose-600/20',
  uyqu: 'from-slate-800 to-indigo-950 shadow-slate-800/25',
  tinchlik: 'from-cyan-700 to-teal-600 shadow-cyan-600/20'
};

export default function AutopilotCard({
  autopilot,
  lowEnergyMode,
  setLowEnergyMode,
  treatSelfMode,
  setTreatSelfMode,
  delayMins,
  onAddDelay,
  onResetDelay,
  sleepQuality,
  setSleepQuality,
  waterGlasses,
  setWaterGlasses,
  completedBlockIds,
  onToggleDone,
  hudEnabled,
  onToggleHud,
  now
}) {
  const { currentBlock, nextBlock, minsRemaining, isHydrationMoment, urgent3DayTasks } = autopilot;

  const gradient = CATEGORY_STYLES[currentBlock.category] || CATEGORY_STYLES.tinchlik;
  const isMorningCheckWindow = now.getHours() >= 5 && now.getHours() <= 10;
  const isDone = completedBlockIds.includes(currentBlock.id);

  return (
    <div className="space-y-3.5">
      {/* Notification Center HUD paneli */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          {hudEnabled ? (
            <BellRing className="w-4 h-4 text-teal-600 shrink-0" />
          ) : (
            <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              Notification Center HUD {hudEnabled ? '(Faol)' : '(O‘chiq)'}
            </p>
            <p className="text-[11px] text-slate-500">
              Pardada: Hozirgi blok • ✓ Bajarildi • ▶ IG Taymer
            </p>
          </div>
        </div>
        <button
          onClick={onToggleHud}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            hudEnabled
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-50'
          }`}
        >
          {hudEnabled ? 'Yoqilgan ✓' : 'Pardaga chiqarish'}
        </button>
      </div>

      {/* Suv va Harakat mikro-eslatmasi */}
      {isHydrationMoment && (
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Droplets className="w-5 h-5 text-sky-600 shrink-0" />
            <p className="text-xs font-bold text-sky-900 dark:text-sky-200">
              2 daqiqa tanaffus: 1 stakan suv iching va bo‘yin-yelka chigilini yozing!
            </p>
          </div>
          <button
            onClick={() => setWaterGlasses((w) => w + 1)}
            className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-extrabold shrink-0 cursor-pointer"
          >
            +1 stakan ({waterGlasses})
          </button>
        </div>
      )}

      {/* Ertalabki uyqu sifati tekshiruvi */}
      {isMorningCheckWindow && !sleepQuality && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MoonStar className="w-5 h-5 text-teal-600 shrink-0" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Kechagi uyqu qanday o‘tdi?
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'good', label: 'Tetikman' },
              { id: 'medium', label: 'O‘rtacha' },
              { id: 'tired', label: 'Kam uxladim' }
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setSleepQuality(q.id);
                  if (q.id === 'tired') setLowEnergyMode(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Asosiy "Hozir Nima Qilaman?" Karta */}
      <div className={`rounded-3xl bg-gradient-to-br ${gradient} text-white p-6 shadow-xl`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-extrabold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" /> Hozirgi Blok
            </span>
            {currentBlock.isMosque && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-300/25 text-amber-200 text-[11px] font-extrabold">
                <Building2 className="w-3 h-3" /> Masjid (35 daq)
              </span>
            )}
          </div>

          <button
            onClick={() => setLowEnergyMode(!lowEnergyMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
              lowEnergyMode
                ? 'bg-amber-300 text-slate-950'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <BatteryLow className="w-3.5 h-3.5" />
            {lowEnergyMode ? 'Kam Quvvat: ON' : 'Quvvat pastmi?'}
          </button>
        </div>

        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
          {currentBlock.title}
        </h2>

        <div className="mt-3 p-4 rounded-2xl bg-black/20 border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/75 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {lowEnergyMode ? 'Minimal Majburiy Qadam:' : 'Aniq harakat:'}
          </p>
          <p className="mt-1 text-sm sm:text-base font-semibold leading-relaxed">
            {lowEnergyMode ? currentBlock.lowEnergyFallback : currentBlock.action}
          </p>

          {/* 4-A: Faqat Mustaqil O'qish blokida muddatiga 3 kun qolgan topshiriqlarni ko'rsatish */}
          {currentBlock.category === 'oqish' &&
            currentBlock.id !== 'blk-uni' &&
            urgent3DayTasks &&
            urgent3DayTasks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/15 space-y-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 uppercase">
                  <AlertCircle className="w-3.5 h-3.5" /> 3 kun ichidagi muddatli topshiriqlar:
                </span>
                {urgent3DayTasks.map((t) => (
                  <div key={t.id} className="text-xs bg-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
                    <span className="font-bold truncate">{t.title}</span>
                    <span className="shrink-0 font-extrabold text-amber-200">
                      {t.daysLeft === 0 ? 'BUGUN' : `${t.daysLeft} kun`}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold bg-white/15 px-3.5 py-2 rounded-xl">
            <Clock className="w-4 h-4" />
            <span>Qolgan: {formatRemaining(minsRemaining)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddDelay}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition cursor-pointer"
              title="Dars yoki yo‘ldan kechikilsa, uyqu vaqtini buzmasdan oraliqni moslaydi"
            >
              <TimerReset className="w-3.5 h-3.5" /> +15 daq{delayMins > 0 ? ` (${delayMins})` : ''}
            </button>

            {delayMins > 0 && (
              <button
                onClick={onResetDelay}
                className="px-2.5 py-2 rounded-xl bg-black/25 text-white/80 text-[11px] font-bold cursor-pointer"
              >
                0
              </button>
            )}

            <button
              onClick={() => onToggleDone(currentBlock.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                isDone
                  ? 'bg-emerald-300 text-slate-950'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isDone ? 'Bajarildi ✓' : 'Bajarildi'}
            </button>
          </div>
        </div>

        {nextBlock && (
          <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-white/85">
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" /> Keyingi:
            </span>
            <span className="font-extrabold">
              {minutesToTime(nextBlock.startMins)} • {nextBlock.title}
            </span>
          </div>
        )}
      </div>

      {/* Tezkor Rejim Tugmalari */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setTreatSelfMode(!treatSelfMode)}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            treatSelfMode
              ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-400 text-amber-900 dark:text-amber-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <UtensilsCrossed className="w-4 h-4 text-amber-600" />
            <span>{treatSelfMode ? 'Xursandchilik: ON' : 'O‘zimni xursand qilish'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {treatSelfMode
              ? 'Kechki taom/hordiq +55 daq uzaytirildi'
              : 'Maxsus taom yoki tashqarida uzoqroq ovqatlanish'}
          </p>
        </button>

        <button
          onClick={() => setWaterGlasses((w) => w + 1)}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-sky-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-500" /> Kunlik Suv
            </span>
            <span className="text-sky-600 dark:text-sky-400">{waterGlasses} / 8 stakan</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Har 2 soatda 1 stakan suv ichish uchun bosing
          </p>
        </button>
      </div>
    </div>
  );
}
