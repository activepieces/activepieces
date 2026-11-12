import { isNil, tryCatchSync } from '@activepieces/core-utils';
import dayjs from 'dayjs';

function create({
  storageKeyPrefix,
  durationHours,
}: CreateTimedDismissalParams): TimedDismissal {
  const storageKey = ({ platformId }: DismissalRef): string =>
    `${storageKeyPrefix}:${platformId}`;

  return {
    read: ({ platformId }) => {
      const { data } = tryCatchSync(() =>
        window.localStorage.getItem(storageKey({ platformId })),
      );
      return isNil(data) || !dayjs(data).isValid() ? undefined : data;
    },
    write: ({ platformId, dismissedAt }) => {
      tryCatchSync(() =>
        window.localStorage.setItem(storageKey({ platformId }), dismissedAt),
      );
    },
    isActive: ({ dismissedAt }) => {
      if (isNil(dismissedAt)) {
        return false;
      }
      const hoursSince = dayjs().diff(dismissedAt, 'hour');
      return hoursSince >= 0 && hoursSince < durationHours;
    },
  };
}

export const timedDismissal = {
  create,
};

type DismissalRef = {
  platformId: string;
};

type WriteDismissalParams = DismissalRef & {
  dismissedAt: string;
};

type IsActiveParams = {
  dismissedAt: string | undefined;
};

type CreateTimedDismissalParams = {
  storageKeyPrefix: string;
  durationHours: number;
};

type TimedDismissal = {
  read: (params: DismissalRef) => string | undefined;
  write: (params: WriteDismissalParams) => void;
  isActive: (params: IsActiveParams) => boolean;
};
