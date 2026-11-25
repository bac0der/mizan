import { timeToMinutes, minutesToTime, resolveWeekParity } from '../utils/timeUtils';
import { computeAutoSleepSchedule, isSleepHours, isWindDownActive } from './sleepEngine';
import { getUpcoming3DayTasks } from './studySync';

/**
 * Mizan v2.2 Dinamik Kunlik Dvigatel:
 * - Juma kuni 17:20 da dars tugashi bilan to'g'ridan-to'g'ri uyga (oilasi oldiga) yo'lga chiqadi (1-A).
 * - Joriy hafta Toq yoki Juft ekanini avtomatik aniqlab, mos darslarni filtrlaydi (2-B).
 * - "+15 daq kechikish" bosilganda uyqu/Wind-Down vaqtini buzmasdan oraliq/o'qish blokini moslaydi (3-B).
 * - Muddatiga 3 kun qolgan topshiriqlarni Mustaqil O'qish blokida ko'rsatadi (4-A).
 */
export function buildDailyAutopilotBlocks({
  now = new Date(),
  prayerTimes,
  classes = [],
  tasks = [],
  settings,
  treatSelfMode = false,
  delayMins = 0
}) {
  const jsDay = now.getDay(); // 0=Yak, 1=Du, 2=Se, 3=Ch, 4=Pa, 5=Ju, 6=Sh
  const fajr = timeToMinutes(prayerTimes.Fajr);
  const sunrise = timeToMinutes(prayerTimes.Sunrise);
  const dhuhr = timeToMinutes(prayerTimes.Dhuhr);
  const maghrib = timeToMinutes(prayerTimes.Maghrib);
  const isha = timeToMinutes(prayerTimes.Isha);

  const weekParity = resolveWeekParity(
    now,
    settings.anchorMondayISO || '2026-11-23',
    settings.anchorParity || 'toq'
  );

  const autoSleep = computeAutoSleepSchedule(prayerTimes.Fajr, settings.sleepCycles || 5);
  const wakeTimeStr = settings.autoSleepFromFajr ? autoSleep.wakeTime : settings.wakeTime;
  const bedTimeStr = settings.autoSleepFromFajr ? autoSleep.bedTime : settings.bedTime;

  const wakeMins = timeToMinutes(wakeTimeStr);
  const bedMins = timeToMinutes(bedTimeStr);

  const urgent3DayTasks = getUpcoming3DayTasks(tasks, now);
  const primaryTaskText =
    urgent3DayTasks.length > 0
      ? `⚠ Muddat (${urgent3DayTasks[0].daysLeft === 0 ? 'BUGUN' : `${urgent3DayTasks[0].daysLeft} kun`}): ${urgent3DayTasks[0].title}`
      : tasks[0]?.title || 'Eng muhim mavzu va konspektlarni o‘zlashtirish';

  const prayerDuration = 35;

  const isUniDay = jsDay >= 1 && jsDay <= 5;
  // Toq / Juft haftaga mos darslarni ajratish
  const todayClasses = classes
    .filter((c) => Number(c.day) === jsDay)
    .filter((c) => {
      const subj = (c.subject || '').toLowerCase();
      if (subj.includes('toq hafta')) return weekParity === 'toq';
      if (subj.includes('juft hafta')) return weekParity === 'juft';
      return true;
    })
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let uniStart = timeToMinutes(settings.uniStart || '13:00');
  let uniEnd = timeToMinutes(settings.uniEnd || '17:20');

  if (isUniDay && todayClasses.length > 0) {
    uniStart = Math.min(...todayClasses.map((c) => timeToMinutes(c.startTime)));
    uniEnd = Math.max(...todayClasses.map((c) => timeToMinutes(c.endTime)));
  } else if (jsDay === 2) {
    uniStart = timeToMinutes('12:30');
  }

  const commuteMins = Number(settings.commuteMins ?? 10);
  const homeArrivalMins = uniEnd + commuteMins + delayMins;
  const isDuringUni = (pMins) => isUniDay && pMins >= uniStart - 10 && pMins <= homeArrivalMins;

  const blocks = [];

  // 1. BOMDOD (35 daq — Masjid)
  blocks.push({
    id: 'blk-fajr',
    category: 'ibodat',
    title: 'Bomdod Namozi (Masjid) & Tonggi Sokinlik',
    startMins: fajr,
    endMins: fajr + prayerDuration,
    action: 'Tahorat, masjidga chiqish (~10 daq), Bomdod namozi va tonggi zikr (35 daqiqa).',
    lowEnergyFallback: 'Uyda yoki masjidda Bomdod namozini o‘qib, 10 daqiqa sokin o‘tiring.',
    allowSocial: false,
    isMosque: true
  });

  // 2. NONUSHTA (30 daq)
  const breakfastStart = Math.max(fajr + prayerDuration + 10, sunrise - 5);
  blocks.push({
    id: 'blk-breakfast',
    category: 'ovqat',
    title: 'Nonushta (Tuxum / Tez taom) & Suv',
    startMins: breakfastStart,
    endMins: breakfastStart + 30,
    action: '30 daqiqa: tuxum/nonushta tayyorlash, shoshmasdan yeyish va 1–2 stakan suv.',
    lowEnergyFallback: 'Qaynatilgan/qovurilgan tuxum va issiq choy — 15 daqiqada tayyor.',
    allowSocial: false
  });

  // 3. TONGGI MUSTAQIL O'QISH (#1: 90 daq)
  const morningStudyStart = breakfastStart + 40;
  const morningStudyEnd = Math.min(morningStudyStart + 90, dhuhr - 10);
  if (morningStudyEnd > morningStudyStart + 30) {
    blocks.push({
      id: 'blk-study-1',
      category: 'oqish',
      title: `Mustaqil O‘qish #1 (${morningStudyEnd - morningStudyStart} daq)`,
      startMins: morningStudyStart,
      endMins: morningStudyEnd,
      action: `Kunlik 3 soatlik reja (1-qism): ${primaryTaskText}`,
      lowEnergyFallback: 'Motivatsiya yo‘q bo‘lsa ham faqat 20 daqiqa konspekt o‘qing.',
      allowSocial: false,
      urgentTasks: urgent3DayTasks
    });
  }

  // 4. PESHIN NAMOZI (35 daq)
  blocks.push({
    id: 'blk-dhuhr',
    category: 'ibodat',
    title:
      jsDay === 5
        ? 'Juma Namozi (Masjid) & Ruhiy Yangilanish'
        : isDuringUni(dhuhr)
        ? 'Peshin Namozi (35 daq)'
        : 'Peshin Namozi (Masjid) & Zikr (35 daq)',
    startMins: dhuhr,
    endMins: dhuhr + prayerDuration,
    action:
      jsDay === 5
        ? 'Juma namozi uchun masjidga chiqish, xutba va duo.'
        : 'Masjidga chiqish, Peshin namozi va 10 daqiqa sukunat.',
    lowEnergyFallback: 'Peshin namozini o‘z vaqtida ado etib, biroz nafas rostlang.',
    allowSocial: false,
    isMosque: !isDuringUni(dhuhr)
  });

  // 5. TUSHLIK
  const lunchStart = dhuhr + prayerDuration;
  const lunchEnd = isUniDay ? Math.max(lunchStart + 25, uniStart - commuteMins) : lunchStart + 35;
  blocks.push({
    id: 'blk-lunch',
    category: 'ovqat',
    title:
      jsDay === 2
        ? 'Tushlik & 12:30 Ma’naviyat Soatiga Tayyorgarlik'
        : isUniDay
        ? 'Tushlik & Universitetga Tayyorgarlik'
        : 'Tushlik & Oila Davrasi',
    startMins: lunchStart,
    endMins: lunchEnd,
    action: isUniDay
      ? `${minutesToTime(lunchEnd)} da universitetga yo‘lga chiqish.`
      : 'Tushlik va oila a’zolari bilan suhbat.',
    lowEnergyFallback: 'Darsga och qorin bilan kirmaslik uchun yengil tamaddi qilib oling.',
    allowSocial: true
  });

  if (isUniDay) {
    const classNames =
      todayClasses.length > 0
        ? todayClasses
            .map((c) => `${c.startTime} ${c.subject}${c.room ? ` (${c.room})` : ''}`)
            .join(' • ')
        : 'Ma’ruza va amaliyotlarda faol qatnashing.';

    blocks.push({
      id: 'blk-uni',
      category: 'oqish',
      title:
        jsDay === 2
          ? `Ma’naviyat Soati & Universitet (${minutesToTime(uniStart)}–${minutesToTime(uniEnd)})`
          : `Universitet Darslari (${minutesToTime(uniStart)}–${minutesToTime(uniEnd)})`,
      startMins: uniStart,
      endMins: uniEnd,
      action: classNames,
      lowEnergyFallback: 'Faqat asosiy mavzu va uyga vazifalarni daftarga belgilab oling.',
      allowSocial: false
    });

    // JUMA KUNI (1-A): 17:20 da dars tugashi bilan to'g'ridan-to'g'ri uyga yo'lga chiqish
    if (jsDay === 5) {
      const fridayTravelEnd = uniEnd + 55 + delayMins;
      blocks.push({
        id: 'blk-friday-travel',
        category: 'oila',
        title: 'Uyga — Oilam Oldiga Yo‘lga Chiqish',
        startMins: uniEnd,
        endMins: fridayTravelEnd,
        action: '17:20 da dars tugashi bilan to‘g‘ridan-to‘g‘ri uyga yo‘lga chiqish. Yo‘lda Shom vaqtiga e’tibor bering.',
        lowEnergyFallback: 'Xotirjam yo‘lga chiqing, uyda oilangiz kutmoqda.',
        allowSocial: true
      });

      const friIshaStart = Math.max(isha, fridayTravelEnd);
      blocks.push({
        id: 'blk-isha-fri',
        category: 'ibodat',
        title: 'Shom / Xufton Namozi (Masjid) & Tinchlik (35 daq)',
        startMins: friIshaStart,
        endMins: friIshaStart + prayerDuration,
        action: 'Uyga yetib kelib namozlarni ado etish va kunlik shukronalik.',
        lowEnergyFallback: 'Namozlarni o‘qib, biroz nafas rostlang.',
        allowSocial: false,
        isMosque: true
      });

      blocks.push({
        id: 'blk-friday-home-barber',
        category: 'ish',
        title: 'Uyda Oila Davrasi & Sartaroshxona Ishi',
        startMins: friIshaStart + prayerDuration,
        endMins: ((bedMins - 45) + 1440) % 1440,
        action: 'Oilangiz bilan kechki ovqat, sartaroshxonada ishlash va mijozlarga chiroyli muomala.',
        lowEnergyFallback: 'Oila davrasida choy ichib, kunning charchog‘ini chiqaring.',
        allowSocial: true
      });
    } else {
      // DUSHANBA–PAYSHANBA
      blocks.push({
        id: 'blk-commute-home',
        category: 'tinchlik',
        title: delayMins > 0 ? `Uygacha Yo‘l (+${delayMins} daq kechikish)` : 'Uygacha Piyoda Yo‘l (10 daq)',
        startMins: uniEnd,
        endMins: homeArrivalMins,
        action: 'Universitetdan uyga piyoda yurish — dars charchog‘ini chiqarish.',
        lowEnergyFallback: 'Shoshmasdan, chuqur nafas olib uyga qayting.',
        allowSocial: false
      });

      const dinnerDuration = treatSelfMode ? 85 : 30;
      let afterDinnerMins = homeArrivalMins;

      if (maghrib < homeArrivalMins) {
        blocks.push({
          id: 'blk-maghrib-dinner',
          category: 'ibodat',
          title: treatSelfMode
            ? 'Shom Namozi + “O‘zimni Xursand Qilish” Taomi'
            : 'Shom Namozi (35 daq) & Kechki Ovqat (30 daq)',
          startMins: homeArrivalMins,
          endMins: homeArrivalMins + prayerDuration + dinnerDuration,
          action: treatSelfMode
            ? 'Shom namozidan keyin o‘zingizni xursand qiladigan taom yoki ko‘chada sokin ovqatlanish.'
            : 'Shom namozi (35 daq) + uyda tuxum/tez ovqat tayyorlash va yeyish (30 daq).',
          lowEnergyFallback: 'Shom namozini o‘qing va 10 daqiqalik tuxumli taom yeng.',
          allowSocial: treatSelfMode,
          isMosque: true
        });
        afterDinnerMins = homeArrivalMins + prayerDuration + dinnerDuration;
      } else {
        blocks.push({
          id: 'blk-maghrib',
          category: 'ibodat',
          title: 'Shom Namozi (Masjid) & Zikr (35 daq)',
          startMins: maghrib,
          endMins: maghrib + prayerDuration,
          action: 'Masjidga chiqish, Shom namozi va 15 daqiqa sokinlik.',
          lowEnergyFallback: 'Shom namozini o‘qing.',
          allowSocial: false,
          isMosque: true
        });

        blocks.push({
          id: 'blk-dinner',
          category: 'ovqat',
          title: treatSelfMode
            ? '“O‘zimni Xursand Qilish” Kechki Taom'
            : 'Kechki Ovqat (Tuxum / Tez Taom — 30 daq)',
          startMins: maghrib + prayerDuration,
          endMins: maghrib + prayerDuration + dinnerDuration,
          action: treatSelfMode
            ? 'Bugun o‘zingizga yoqqan taom yoki tashqarida hordiq chiqarib ovqatlaning.'
            : '30 daqiqa: uyda tuxum/taom tayyorlash, yeyish va idishlarni yig‘ishtirish.',
          lowEnergyFallback: '15 daqiqada tuxum qovurib/qaynatib ovqatlaning.',
          allowSocial: treatSelfMode
        });
        afterDinnerMins = maghrib + prayerDuration + dinnerDuration;
      }

      // 3-B: Kechikish bo'lsa, 2-o'qish bloki qolgan vaqtga moslashadi va uyqu vaqtini buzmaydi
      if (!treatSelfMode && isha > afterDinnerMins + 15) {
        blocks.push({
          id: 'blk-study-2',
          category: 'oqish',
          title: `Mustaqil O‘qish #2 (${Math.min(45, isha - afterDinnerMins)} daq)`,
          startMins: afterDinnerMins,
          endMins: isha,
          action: `Kunlik 3 soatlik reja (2-qism): ${primaryTaskText}`,
          lowEnergyFallback: 'Faqat 20 daqiqa bugungi konspektga ko‘z yugurtiring.',
          allowSocial: false,
          urgentTasks: urgent3DayTasks
        });
      }

      const ishaStart = Math.max(isha, afterDinnerMins);
      blocks.push({
        id: 'blk-isha',
        category: 'ibodat',
        title: 'Xufton Namozi (Masjid) & Tinchlik (35 daq)',
        startMins: ishaStart,
        endMins: ishaStart + prayerDuration,
        action: 'Masjidga chiqish, Xufton namozi va kunlik shovqindan to‘liq uzilish (35 daq).',
        lowEnergyFallback: 'Xufton namozini o‘qib, 10 daqiqa sokin o‘tiring.',
        allowSocial: false,
        isMosque: true
      });

      const familyStart = ishaStart + prayerDuration;
      const familyEnd = familyStart + 20;
      blocks.push({
        id: 'blk-family',
        category: 'oila',
        title: 'Oila & Yaqinlar Bilan Bog‘lanish (20 daq)',
        startMins: familyStart,
        endMins: familyEnd,
        action: 'Ota-onangiz, akangiz, ukangiz yoki singlingizga qo‘ng‘iroq qilib hol-ahvol so‘rang.',
        lowEnergyFallback: 'Hech bo‘lmaganda ota-onangizga iliq ovozli xabar yoki qo‘ng‘iroq qiling.',
        allowSocial: true
      });

      const study3Start = familyEnd;
      const windDownStart = ((bedMins - 45) + 1440) % 1440;
      if (windDownStart > study3Start + 15) {
        blocks.push({
          id: 'blk-study-3',
          category: 'oqish',
          title: `Mustaqil O‘qish #3 (${Math.min(45, windDownStart - study3Start)} daq)`,
          startMins: study3Start,
          endMins: windDownStart,
          action: `Kunlik 3 soatlik reja (3-qism): ${primaryTaskText}`,
          lowEnergyFallback: 'Ertangi sumka va 1-dars materiallarini tayyorlab qo‘ying.',
          allowSocial: false,
          urgentTasks: urgent3DayTasks
        });
      }
    }
  } else {
    // SHANBA VA YAKSHANBA: Sartaroshxona + Oila + Mustaqil o'qish
    const barberStart = Math.max(lunchEnd + 15, 810);
    const barberEnd = Math.min(barberStart + 150, maghrib - 45);
    blocks.push({
      id: 'blk-barber-weekend',
      category: 'ish',
      title: 'Sartaroshxona Ishi & Mijozlar Bilan Muomala',
      startMins: barberStart,
      endMins: barberEnd,
      action: 'Halol mehnat, mijozlarga shirin so‘z va chiroyli xizmat (Til filtrini yodda tuting).',
      lowEnergyFallback: 'Mijozlar orasida 5 daqiqa o‘tirib suv iching.',
      allowSocial: false
    });

    blocks.push({
      id: 'blk-maghrib-wknd',
      category: 'ibodat',
      title: 'Shom Namozi (Masjid) & Zikr (35 daq)',
      startMins: maghrib,
      endMins: maghrib + prayerDuration,
      action: 'Uyda oila davrasida Shom namoziga masjidga chiqish (35 daqiqa).',
      lowEnergyFallback: 'Shom namozini o‘qib, 10 daqiqa sokin o‘tiring.',
      allowSocial: false,
      isMosque: true
    });

    const wkndDinnerStart = maghrib + prayerDuration;
    blocks.push({
      id: 'blk-dinner-wknd',
      category: 'oila',
      title: 'Kechki Ovqat & Oila Davrasi',
      startMins: wkndDinnerStart,
      endMins: Math.max(wkndDinnerStart + 45, isha),
      action: 'Ota-ona, aka-uka va singlingiz bilan bir dasturxonda samimiy suhbat.',
      lowEnergyFallback: 'Oila davrasida telefondan uzoq bo‘lib, ularni tinglang.',
      allowSocial: false
    });

    blocks.push({
      id: 'blk-isha-wknd',
      category: 'ibodat',
      title: 'Xufton Namozi (Masjid) & Tinchlik (35 daq)',
      startMins: isha,
      endMins: isha + prayerDuration,
      action: 'Masjidga chiqish, Xufton namozi va kunlik shukronalik.',
      lowEnergyFallback: 'Xufton namozini ado eting.',
      allowSocial: false,
      isMosque: true
    });

    const wkndStudyStart = isha + prayerDuration;
    const windDownStartWknd = ((bedMins - 45) + 1440) % 1440;
    if (windDownStartWknd > wkndStudyStart + 25) {
      blocks.push({
        id: 'blk-study-wknd',
        category: 'oqish',
        title: `Mustaqil O‘qish & Haftalik Takror (${Math.min(90, windDownStartWknd - wkndStudyStart)} daq)`,
        startMins: wkndStudyStart,
        endMins: windDownStartWknd,
        action: `Haftalik mustahkamlash: ${primaryTaskText}`,
        lowEnergyFallback: 'Faqat 25 daqiqa eng muhim konspektlarni ko‘zdan kechiring.',
        allowSocial: true,
        urgentTasks: urgent3DayTasks
      });
    }
  }

  // WIND-DOWN (Uyqudan 45 daqiqa oldin — hech qachon buzilmaydi)
  const windDownStartFinal = ((bedMins - 45) + 1440) % 1440;
  blocks.push({
    id: 'blk-winddown',
    category: 'uyqu',
    title: 'Wind-Down: Uyquga Kirish (45 daq)',
    startMins: windDownStartFinal,
    endMins: bedMins,
    action: 'Ijtimoiy tarmoqlar yopiq. Til & Fikr sarhisobini to‘ldiring, chiroqni pasaytiring.',
    lowEnergyFallback: 'Telefonni quvvatlagichga uzoqroqqa qo‘yib, uyquga tayyorlaning.',
    allowSocial: false
  });

  const hydrationHours = [510, 660, 1060, 1200];

  blocks.sort((a, b) => a.startMins - b.startMins);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isHydrationMoment = hydrationHours.some((h) => Math.abs(nowMins - h) <= 2);

  if (isSleepHours(nowMins, bedTimeStr, wakeTimeStr)) {
    return {
      blocks,
      weekParity,
      urgent3DayTasks,
      currentBlock: {
        id: 'blk-sleep',
        category: 'uyqu',
        title: 'Chuqur Uyqu & Tiklanish Rejimi',
        startMins: bedMins,
        endMins: wakeMins,
        action: `Bomdod (${prayerTimes.Fajr}) dan 15 daqiqa oldin — ${wakeTimeStr} da uyg‘onasiz. Hozir to‘liq dam oling.`,
        lowEnergyFallback: 'Ko‘zlarni yuming — ertangi kuch hozirgi uyquda.',
        allowSocial: false
      },
      nextBlock: blocks[0] || null,
      minsRemaining: wakeMins >= nowMins ? wakeMins - nowMins : 1440 - nowMins + wakeMins,
      windDown: false,
      isHydrationMoment: false,
      autoSleep
    };
  }

  let currentBlock = null;
  let nextBlock = null;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (nowMins >= b.startMins && nowMins < b.endMins) {
      currentBlock = b;
      nextBlock = blocks[i + 1] || {
        id: 'blk-sleep-next',
        title: 'Uyqu Vaqti',
        startMins: bedMins
      };
      break;
    }
    if (nowMins < b.startMins && !nextBlock) {
      nextBlock = b;
    }
  }

  if (!currentBlock) {
    currentBlock = {
      id: 'blk-transition',
      category: 'tinchlik',
      title: 'Oraliq Sokinlik & Muvozanat',
      startMins: nowMins,
      endMins: nextBlock ? nextBlock.startMins : bedMins,
      action: nextBlock
        ? `${minutesToTime(nextBlock.startMins)} dagi “${nextBlock.title}” blokigacha tayyorlaning.`
        : 'Kunni sokin yakunlang.',
      lowEnergyFallback: '1 stakan suv iching va bo‘yin/yelka chigilini yozing.',
      allowSocial: false
    };
  }

  const endTarget = currentBlock.endMins >= nowMins ? currentBlock.endMins : bedMins;
  const minsRemaining = Math.max(1, endTarget - nowMins);

  return {
    blocks,
    weekParity,
    urgent3DayTasks,
    currentBlock,
    nextBlock,
    minsRemaining,
    windDown: isWindDownActive(nowMins, bedTimeStr),
    isHydrationMoment,
    autoSleep
  };
}
