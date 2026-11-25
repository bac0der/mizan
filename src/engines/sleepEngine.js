import { timeToMinutes, minutesToTime } from '../utils/timeUtils';

export function computeAutoSleepSchedule(fajrStr = '05:55', cycleCount = 5) {
  const fajrMins = timeToMinutes(fajrStr);
  const wakeMins = ((fajrMins - 15) + 1440) % 1440;
  const fallAsleepBuffer = 15;

  const totalSleepMins = cycleCount * 90;
  const bedMins = ((wakeMins - totalSleepMins - fallAsleepBuffer) + 1440) % 1440;
  const windDownMins = ((bedMins - 45) + 1440) % 1440;

  return {
    wakeTime: minutesToTime(wakeMins),
    bedTime: minutesToTime(bedMins),
    windDownTime: minutesToTime(windDownMins),
    sleepHours: (totalSleepMins / 60).toFixed(1)
  };
}

export function isWindDownActive(nowMins, bedTimeStr) {
  const bedMins = timeToMinutes(bedTimeStr);
  const windDownStart = ((bedMins - 45) + 1440) % 1440;

  if (windDownStart < bedMins) {
    return nowMins >= windDownStart && nowMins < bedMins;
  }
  return nowMins >= windDownStart || nowMins < bedMins;
}

export function isSleepHours(nowMins, bedTimeStr, wakeTimeStr) {
  const bed = timeToMinutes(bedTimeStr);
  const wake = timeToMinutes(wakeTimeStr);
  if (bed > wake) {
    return nowMins >= bed || nowMins < wake;
  }
  return nowMins >= bed && nowMins < wake;
}
