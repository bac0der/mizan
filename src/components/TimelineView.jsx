import React from 'react';
import { RefreshCw, CheckCircle2, Building2 } from 'lucide-react';
import { minutesToTime } from '../utils/timeUtils';

const BADGES = {
  ibodat: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  oqish: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  ish: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  ovqat: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  oila: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  uyqu: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  tinchlik: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
};

export default function TimelineView({
  prayerTimes,
  prayerSource,
  blocks,
  weekParity,
  currentBlockId,
  onSyncPrayers,
  syncing,
  now
}) {
  const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const dayLabel = dayNames[now.getDay()];
  const parityBadge = weekParity === 'toq' ? 'TOQ HAFTA' : 'JUFT HAFTA';

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600">
              {dayLabel} • {parityBadge}
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              Bugungi Namoz Vaqtlari (Har biriga 35 daq)
            </h3>
            <p className="text-[11px] text-slate-500">
              Manba: {prayerSource === 'cache' ? 'Avtomatik sinxronlangan (Offline tayyor)' : 'Ichki zaxira jadval'}
            </p>
          </div>
          <button
            onClick={onSyncPrayers}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          {[
            { label: 'Bomdod', time: prayerTimes.Fajr },
            { label: 'Peshin', time: prayerTimes.Dhuhr },
            { label: 'Asr', time: prayerTimes.Asr },
            { label: 'Shom', time: prayerTimes.Maghrib },
            { label: 'Xufton', time: prayerTimes.Isha }
          ].map((p) => (
            <div key={p.label} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70">
              <span className="block text-[10px] font-bold text-slate-400">{p.label}</span>
              <span className="block text-xs sm:text-sm font-extrabold tabular-nums text-slate-900 dark:text-white mt-0.5">
                {p.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {blocks.map((blk) => {
          const isCurrent = blk.id === currentBlockId;
          return (
            <div
              key={blk.id}
              className={`rounded-2xl border p-4 transition ${
                isCurrent
                  ? 'bg-teal-50/70 dark:bg-teal-500/10 border-teal-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold tabular-nums text-slate-500">
                  {minutesToTime(blk.startMins)} – {minutesToTime(blk.endMins)}
                </span>
                <div className="flex items-center gap-1.5">
                  {blk.isMosque && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <Building2 className="w-3 h-3" /> Masjid
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      BADGES[blk.category] || BADGES.tinchlik
                    }`}
                  >
                    {blk.category}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{blk.title}</h4>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-700 dark:text-teal-300 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hozir
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{blk.action}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
