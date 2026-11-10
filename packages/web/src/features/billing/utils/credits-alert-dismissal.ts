import { timedDismissal } from '@/lib/timed-dismissal';

export const creditsAlertDismissal = timedDismissal.create({
  storageKeyPrefix: 'ap-credits-alert-dismissed',
  durationHours: 24,
});
