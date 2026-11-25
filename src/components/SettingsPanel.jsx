import React from 'react';
import {
  MoonStar,
  MapPin,
  Upload,
  Download,
  BookOpenCheck,
  Sun,
  Moon,
  GraduationCap,
  CalendarRange
} from 'lucide-react';
import { CITIES } from '../engines/prayerEngine';
import { getMondayOfWeek, getTodayKey } from '../utils/timeUtils';

export default function SettingsPanel({
  settings,
  setSettings,
  weekParity,
  autoSleep,
  darkMode,
  setDarkMode,
  syncedClassesCount,
  syncedTasksCount,
  historyCount,
  onImportStudyOS,
  onExportMizan,
  now
}) {
  const handleSetWeekParity = (parity) => {
    const mondayISO = getTodayKey(getMondayOfWeek(now));
    setSettings({
      ...settings,
      anchorMondayISO: mondayISO,
      anchorParity: parity
    });
  };

  return (
    <div className="space-y-5">
      {/* Toq / Juft Hafta Avtomatik Almashinuvi */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Toq / Juft Hafta Tizimi (Hozir: {weekParity.toUpperCase()} HAFTA)
            </h3>
            <p className="text-xs text-slate-500">
              Bir marta belgilang — keyingi haftalarda ilova o‘zi navbatma-navbat almashtirib boradi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: 'toq', label: 'Joriy hafta: TOQ' },
            { id: 'juft', label: 'Joriy hafta: JUFT' }
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSetWeekParity(opt.id)}
              className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold transition cursor-pointer ${
                weekParity === opt.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Namozga Bog'langan Avtomatik Uyqu Tizimi */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <MoonStar className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Namozga Bog‘langan Avto-Uyqu Tizimi
              </h3>
              <p className="text-xs text-slate-500">
                Bomdod vaqti o‘zgarsa, uyg‘onish (Bomdod − 15 daq) va uxlash avtomatik siljiydi
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoSleepFromFajr}
            onChange={(e) => setSettings({ ...settings, autoSleepFromFajr: e.target.checked })}
            className="w-5 h-5 accent-teal-600 cursor-pointer"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/20 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Avto-uyg‘onish:</span>{' '}
            <strong className="text-slate-900 dark:text-white">{autoSleep.wakeTime}</strong>
          </div>
          <div>
            <span className="text-slate-500">Wind-Down:</span>{' '}
            <strong className="text-indigo-700 dark:text-indigo-300">{autoSleep.windDownTime}</strong>
          </div>
          <div>
            <span className="text-slate-500">Uxlash:</span>{' '}
            <strong className="text-slate-900 dark:text-white">{autoSleep.bedTime}</strong>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[5, 4, 3].map((cycles) => (
            <button
              key={cycles}
              type="button"
              onClick={() => setSettings({ ...settings, sleepCycles: cycles, autoSleepFromFajr: true })}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                settings.sleepCycles === cycles
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="block text-sm font-extrabold">{cycles} sikl</span>
              <span className="block text-[11px] opacity-85">{(cycles * 1.5).toFixed(1)} soat</span>
            </button>
          ))}
        </div>
      </div>

      {/* Universitet & Yo'l Vaqti */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-teal-600" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Universitet & Yo‘l Sozlamalari (Du–Ju)
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Dars boshlanishi</label>
            <input
              type="time"
              value={settings.uniStart}
              onChange={(e) => setSettings({ ...settings, uniStart: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Dars tugashi</label>
            <input
              type="time"
              value={settings.uniEnd}
              onChange={(e) => setSettings({ ...settings, uniEnd: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Uygacha yo‘l (daq)</label>
            <input
              type="number"
              min="5"
              max="90"
              value={settings.commuteMins}
              onChange={(e) => setSettings({ ...settings, commuteMins: Number(e.target.value) || 10 })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
            />
          </div>
        </div>
      </div>

      {/* Shahar va Ijtimoiy Tarmoq */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" /> Shahar
            </label>
            <select
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Standart ijtimoiy tarmoq limiti (daq)
            </label>
            <input
              type="number"
              min="10"
              max="60"
              step="5"
              value={settings.socialLimitMins}
              onChange={(e) =>
                setSettings({ ...settings, socialLimitMins: Math.max(10, Number(e.target.value) || 30) })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-extrabold"
            />
          </div>
        </div>
      </div>

      {/* StudyOS Sinxron & 3 Kunlik Xotira Nazorati */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <BookOpenCheck className="w-5 h-5 text-teal-600" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              O‘quv Reja & 3 Kunlik Xotira Nazorati
            </h3>
            <p className="text-xs text-slate-500">
              Ulangan: <strong>{syncedClassesCount} ta dars</strong> • <strong>{syncedTasksCount} ta faol topshiriq</strong> • Tarix: <strong>{historyCount}/3 kun</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold cursor-pointer">
            <Upload className="w-4 h-4" /> StudyOS JSON yuklash
            <input type="file" accept=".json,application/json" onChange={onImportStudyOS} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onExportMizan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold cursor-pointer"
          >
            <Download className="w-4 h-4" /> Zaxira eksport
          </button>

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Kunduzgi' : 'Tungi'}
          </button>
        </div>
      </div>
    </div>
  );
}
