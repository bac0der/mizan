import { getTodayKey } from '../utils/timeUtils';

export const FALLBACK_PRAYER_TIMES = {
  Fajr: '05:55',
  Sunrise: '07:22',
  Dhuhr: '12:15',
  Asr: '15:10',
  Maghrib: '17:02',
  Isha: '18:25'
};

export const CITIES = [
  { id: 'Tashkent', name: 'Toshkent', country: 'Uzbekistan' },
  { id: 'Samarkand', name: 'Samarqand', country: 'Uzbekistan' },
  { id: 'Bukhara', name: 'Buxoro', country: 'Uzbekistan' },
  { id: 'Namangan', name: 'Namangan', country: 'Uzbekistan' },
  { id: 'Andijan', name: 'Andijon', country: 'Uzbekistan' },
  { id: 'Fergana', name: 'Farg‘ona', country: 'Uzbekistan' },
  { id: 'Karshi', name: 'Qarshi', country: 'Uzbekistan' },
  { id: 'Nukus', name: 'Nukus', country: 'Uzbekistan' }
];

const CACHE_KEY = 'mizan_prayer_cache_v2';

export function getCachedPrayerTimes(city = 'Tashkent', date = new Date()) {
  const today = getTodayKey(date);
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.city === city && parsed.days && parsed.days[today]) {
        return { timings: parsed.days[today], source: 'cache' };
      }
    }
  } catch {
    // ignore
  }
  return { timings: FALLBACK_PRAYER_TIMES, source: 'fallback' };
}

export async function syncMonthlyPrayerTimes(city = 'Tashkent', country = 'Uzbekistan') {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const url = `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${encodeURIComponent(
    city
  )}&country=${encodeURIComponent(country)}&method=3&school=1`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Namoz vaqtlarini yuklab bo‘lmadi');

  const json = await response.json();
  if (!json.data || !Array.isArray(json.data)) throw new Error('Noto‘g‘ri API javobi');

  const daysMap = {};
  json.data.forEach((item) => {
    const greg = item.date?.gregorian?.date;
    if (greg && item.timings) {
      const [dd, mm, yyyy] = greg.split('-');
      const isoKey = `${yyyy}-${mm}-${dd}`;
      daysMap[isoKey] = {
        Fajr: item.timings.Fajr.split(' ')[0],
        Sunrise: item.timings.Sunrise.split(' ')[0],
        Dhuhr: item.timings.Dhuhr.split(' ')[0],
        Asr: item.timings.Asr.split(' ')[0],
        Maghrib: item.timings.Maghrib.split(' ')[0],
        Isha: item.timings.Isha.split(' ')[0]
      };
    }
  });

  window.localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      city,
      updatedAt: new Date().toISOString(),
      days: daysMap
    })
  );

  const today = getTodayKey(now);
  return daysMap[today] || FALLBACK_PRAYER_TIMES;
}
