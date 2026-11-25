import { diffDaysFromToday } from '../utils/timeUtils';

export function parseStudyOSBackup(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Yaroqli JSON fayl tanlanmadi.' };
  }

  if (!Array.isArray(raw.classes) && !Array.isArray(raw.tasks)) {
    return {
      valid: false,
      error: 'Fayl ichida dars jadvali (classes) yoki vazifalar (tasks) topilmadi.'
    };
  }

  const classes = (raw.classes || []).map((c, idx) => ({
    id: c.id || `sync-cls-${idx}`,
    day: Number(c.day || 1),
    subject: String(c.subject || 'Dars'),
    type: String(c.type || 'Mashg‘ulot'),
    startTime: String(c.startTime || '13:00'),
    endTime: String(c.endTime || '17:20'),
    room: String(c.room || '')
  }));

  const tasks = (raw.tasks || [])
    .filter((t) => !t.completed)
    .map((t, idx) => ({
      id: t.id || `sync-tsk-${idx}`,
      title: String(t.title || 'Vazifa'),
      subject: String(t.subject || 'O‘qish'),
      deadline: t.deadline ? String(t.deadline) : '',
      urgent: Boolean(t.urgent),
      important: Boolean(t.important)
    }));

  return {
    valid: true,
    classes,
    tasks
  };
}

/**
 * Muddati 3 kun yoki undan kam qolgan topshiriqlarni ajratadi.
 * Topshiriq muddati o'tib, 3 kunlik tekshiruv/baholash davri tugagach (-3 kundan keyin) avtomatik chiqarib tashlanadi.
 */
export function getUpcoming3DayTasks(tasks = [], now = new Date()) {
  return tasks
    .map((t) => ({
      ...t,
      daysLeft: diffDaysFromToday(t.deadline, now)
    }))
    .filter((t) => t.daysLeft !== null && t.daysLeft >= 0 && t.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Deadline o'tganiga 3 kundan oshgan topshiriqlarni xotiradan tozalaydi
 * (chunki 3 kun ichida baho qo'yiladi, undan keyingisi ahamiyatsiz).
 */
export function pruneExpiredTasks(tasks = [], now = new Date()) {
  return tasks.filter((t) => {
    const d = diffDaysFromToday(t.deadline, now);
    if (d === null) return true;
    return d >= -3;
  });
}
