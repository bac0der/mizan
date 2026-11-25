export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMins) {
  const normalized = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, '0');
  const m = String(normalized % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatRemaining(mins) {
  const abs = Math.max(0, Math.round(mins));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h > 0 && m > 0) return `${h} soat ${m} daq`;
  if (h > 0) return `${h} soat`;
  return `${m} daq`;
}

export function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Dushanba 00:00 ga normallashtirilgan hafta boshini olish
export function getMondayOfWeek(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Yak, 1=Du...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Tayanch hafta (anchorMonday + anchorParity: 'toq' | 'juft') asosida
 * joriy hafta Toq yoki Juft ekanini avtomatik hisoblaydi.
 */
export function resolveWeekParity(now = new Date(), anchorMondayISO = '2026-11-23', anchorParity = 'toq') {
  const [ay, am, ad] = anchorMondayISO.split('-').map(Number);
  const anchorMon = new Date(ay, (am || 1) - 1, ad || 1);
  const currentMon = getMondayOfWeek(now);
  const diffWeeks = Math.round((currentMon - anchorMon) / (7 * 24 * 60 * 60 * 1000));
  const isEvenStep = Math.abs(diffWeeks) % 2 === 0;
  if (isEvenStep) return anchorParity;
  return anchorParity === 'toq' ? 'juft' : 'toq';
}

export function diffDaysFromToday(deadlineISO, now = new Date()) {
  if (!deadlineISO) return null;
  const [y, m, d] = deadlineISO.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}
