import { minutesToTime, formatRemaining } from './timeUtils';

const HUD_TAG = 'mizan-live-hud';
const DEADLINE_TAG = 'mizan-deadline-hourly';

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export async function updateNotificationHud({
  enabled,
  currentBlock,
  nextBlock,
  minsRemaining,
  socialRemainingSecs,
  socialRunning,
  isDone,
  urgentTask
}) {
  if (!enabled || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const igMins = Math.floor(Math.max(0, socialRemainingSecs) / 60);
  const igSecs = String(Math.max(0, socialRemainingSecs) % 60).padStart(2, '0');
  const igStatus = socialRunning ? `IG Taymer: ${igMins}:${igSecs}` : `IG qoldiq: ${igMins} daq`;

  const title = `${currentBlock.title} • ${formatRemaining(minsRemaining)} qoldi`;
  const nextPart = nextBlock
    ? `Keyingi: ${minutesToTime(nextBlock.startMins)} ${nextBlock.title}`
    : 'Kun yakuni';
  const deadlineLine = urgentTask
    ? `
⚠ Muddat (${urgentTask.daysLeft === 0 ? 'BUGUN' : `${urgentTask.daysLeft} kun`}): ${urgentTask.title}`
    : '';

  const body = `${nextPart} • ${igStatus}${deadlineLine}`;

  const options = {
    body,
    tag: HUD_TAG,
    renotify: false,
    silent: true,
    requireInteraction: true,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    actions: [
      {
        action: 'toggle-done',
        title: isDone ? '✓ Bajarilgan' : '✓ Bajarildi'
      },
      {
        action: 'toggle-ig',
        title: socialRunning ? '⏸ IG Pauza' : '▶ IG Taymer'
      }
    ]
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, {
      body: options.body,
      tag: HUD_TAG,
      silent: true,
      requireInteraction: true,
      icon: options.icon
    });
  } catch {
    // Fallback
  }
}

/**
 * Muddat tugashiga 3 kun yoki undan kam qolganda har soatda keladigan ogohlantirish
 */
export async function sendHourlyDeadlineAlert({ task, hoursLeft }) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const dayLabel =
    task.daysLeft === 0
      ? 'BUGUN muddat tugaydi!'
      : task.daysLeft === 1
      ? 'Ertaga muddat tugaydi (1 kun qoldi)!'
      : `Muddat tugashiga ${task.daysLeft} kun qoldi!`;

  const title = `⏰ Topshiriq Eslatmasi: ${dayLabel}`;
  const body = `${task.title} (${task.subject}) • Taxminan ${hoursLeft} soat vaqt qoldi.`;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          tag: DEADLINE_TAG,
          renotify: true,
          silent: false,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png'
        });
        return;
      }
    }
    new Notification(title, { body, tag: DEADLINE_TAG, icon: '/pwa-192x192.png' });
  } catch {
    // ignore
  }
}

export async function clearNotificationHud() {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const list = await reg.getNotifications({ tag: HUD_TAG });
      list.forEach((n) => n.close());
    }
  } catch {
    // ignore
  }
}
