import { isNil, tryCatchSync } from '@activepieces/core-utils';
import dayjs from 'dayjs';

const STORAGE_KEY_PREFIX = 'ap-credits-alert-dismissed';
const DISMISSAL_DURATION_HOURS = 24;

function read({ platformId }: DismissalRef): string | undefined {
  const { data } = tryCatchSync(() =>
    window.localStorage.getItem(storageKey({ platformId })),
  );
  return isNil(data) || !dayjs(data).isValid() ? undefined : data;
}

function write({ platformId, dismissedAt }: WriteDismissalParams): void {
  tryCatchSync(() =>
    window.localStorage.setItem(storageKey({ platformId }), dismissedAt),
  );
}

function isActive({ dismissedAt }: IsActiveParams): boolean {
  if (isNil(dismissedAt)) {
    return false;
  }
  const hoursSince = dayjs().diff(dismissedAt, 'hour');
  return hoursSince >= 0 && hoursSince < DISMISSAL_DURATION_HOURS;
}

function storageKey({ platformId }: DismissalRef): string {
  return `${STORAGE_KEY_PREFIX}:${platformId}`;
}

export const creditsAlertDismissal = {
  read,
  write,
  isActive,
};

export type DismissalRef = {
  platformId: string;
};

export type WriteDismissalParams = DismissalRef & {
  dismissedAt: string;
};

export type IsActiveParams = {
  dismissedAt: string | undefined;
};
