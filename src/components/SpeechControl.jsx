import React, { useState, useEffect } from 'react';
import { MessageSquareHeart, PauseCircle, Plus, AlertTriangle } from 'lucide-react';

const SLIP_CATEGORIES = [
  { id: 'anger', label: 'Keskinlik / Asab', desc: 'Jahl bilan gapirish' },
  { id: 'gossip', label: 'G‘iybat / Tanqid', desc: 'Birovning ortidan gap' },
  { id: 'debate', label: 'Behuda bahs', desc: 'Foydasiz tortishish' },
  { id: 'complaint', label: 'Shikoyat / Xayol', desc: 'Noshukrlik yoki keraksiz o‘y' }
];

export default function SpeechControl({
  speechStats,
  setSpeechStats,
  eveningReflection,
  setEveningReflection
}) {
  const [pauseSeconds, setPauseSeconds] = useState(0);

  useEffect(() => {
    if (pauseSeconds <= 0) return;
    const t = setTimeout(() => setPauseSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [pauseSeconds]);

  const goodCount = speechStats.good || 0;
  const slips = speechStats.slips || { anger: 0, gossip: 0, debate: 0, complaint: 0 };
  const totalSlips = Object.values(slips).reduce((a, b) => a + b, 0);

  const incrementSlip = (catId) => {
    setSpeechStats((prev) => ({
      ...prev,
      slips: {
        ...(prev.slips || { anger: 0, gossip: 0, debate: 0, complaint: 0 }),
        [catId]: ((prev.slips || {})[catId] || 0) + 1
      }
    }));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-teal-950 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              Til va Fikr Filtri
            </span>
            <h3 className="mt-1 text-lg font-extrabold">
              Gapirishdan oldin 3 soniya to‘xtash
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Asab, bahs yoki g‘iybat boshlanishidan oldin bosib o‘zingizni to‘xtating:
            </p>
          </div>
          <button
            onClick={() => setPauseSeconds(3)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shrink-0 transition cursor-pointer"
          >
            <PauseCircle className="w-4 h-4" />
            {pauseSeconds > 0 ? `${pauseSeconds} soniya...` : 'Stop & O‘yla'}
          </button>
        </div>

        {pauseSeconds > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-white/10 border border-white/15 text-center">
            <p className="text-sm font-extrabold text-amber-300">
              1. Rostmi? • 2. Foydalimi? • 3. Yumshoq aytish mumkinmi?
            </p>
            <p className="text-xs text-slate-200 mt-1">
              Sukut saqlash — eng katta kuch. Chuqur nafas oling.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/20 p-5 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <MessageSquareHeart className="w-4 h-4" /> Shirin so‘z, Sabr va Yaxshi gumon
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Mijozlarga, oilaga yoki do‘stlarga chiroyli muomala qilganingizda belgilang.
          </p>
        </div>
        <button
          onClick={() => setSpeechStats((prev) => ({ ...prev, good: (prev.good || 0) + 1 }))}
          className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> +{goodCount}
        </button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Nazoratdan chiqqan holatlar
          </h4>
          <span className="text-xs font-extrabold text-rose-600">Jami: -{totalSlips}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {SLIP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => incrementSlip(cat.id)}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200/70 dark:border-slate-700 text-left transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {cat.label}
                </span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                  -{slips[cat.id] || 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
          Kechki Fikr & Til Sarhisobi (Wind-Down)
        </h4>
        <p className="text-xs text-slate-500 mt-0.5 mb-3">
          Bugun qaysi holatda o‘zingizni tiya oldingiz va ertaga nimani yaxshilaysiz?
        </p>
        <textarea
          rows={4}
          value={eveningReflection}
          onChange={(e) => setEveningReflection(e.target.value)}
          placeholder="1. Bugun tilimni tiygan vaziyatim: ...&#10;2. Oilamga yoki mijozlarga aytgan yaxshi so‘zim: ...&#10;3. Ertangi asosiy niyatim: ..."
          className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    </div>
  );
}
