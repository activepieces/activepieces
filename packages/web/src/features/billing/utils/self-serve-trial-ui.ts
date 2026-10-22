import { tryCatchSync } from '@activepieces/core-utils';

function focusDialogItself(event: Event): void {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.focus();
  }
}

function readLocalStorageFlag(key: string): boolean {
  const { data } = tryCatchSync(() => window.localStorage.getItem(key));
  return data === 'true';
}

function setLocalStorageFlag(key: string): void {
  tryCatchSync(() => window.localStorage.setItem(key, 'true'));
}

function trialStorageId({
  platformId,
  userId,
  endsAt,
}: TrialStorageIdParams): string {
  return `${platformId}-${userId ?? 'unknown'}-${
    endsAt?.toISOString() ?? 'unknown'
  }`;
}

export const selfServeTrialUi = {
  focusDialogItself,
  readLocalStorageFlag,
  setLocalStorageFlag,
  trialStorageId,
};

type TrialStorageIdParams = {
  platformId: string;
  userId: string | null;
  endsAt: Date | null;
};
