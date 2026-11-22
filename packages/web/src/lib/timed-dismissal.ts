import { isNil, tryCatchSync } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { useState } from 'react';

function create({
  storageKeyPrefix,
  durationHours,
}: CreateTimedDismissalParams): TimedDismissal {
  const storageKey = ({ platformId }: DismissalRef): string =>
    `${storageKeyPrefix}:${platformId}`;

  const read = ({ platformId }: DismissalRef): string | undefined => {
    const { data } = tryCatchSync(() =>
      window.localStorage.getItem(storageKey({ platformId })),
    );
    return isNil(data) || !dayjs(data).isValid() ? undefined : data;
  };
  const write = ({ platformId, dismissedAt }: WriteDismissalParams): void => {
    tryCatchSync(() =>
      window.localStorage.setItem(storageKey({ platformId }), dismissedAt),
    );
  };
  const isActive = ({ dismissedAt }: IsActiveParams): boolean => {
    if (isNil(dismissedAt)) {
      return false;
    }
    const hoursSince = dayjs().diff(dismissedAt, 'hour');
    return hoursSince >= 0 && hoursSince < durationHours;
  };

  return {
    read,
    write,
    isActive,
    useDismissal: ({ platformId }) => {
      const [dismissedAt, setDismissedAt] = useState(() =>
        read({ platformId }),
      );
      const dismiss = () => {
        const timestamp = dayjs().toISOString();
        setDismissedAt(timestamp);
        write({ platformId, dismissedAt: timestamp });
      };
      return { isDismissed: isActive({ dismissedAt }), dismiss };
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

type Dismissal = {
  isDismissed: boolean;
  dismiss: () => void;
};

type TimedDismissal = {
  read: (params: DismissalRef) => string | undefined;
  write: (params: WriteDismissalParams) => void;
  isActive: (params: IsActiveParams) => boolean;
  useDismissal: (params: DismissalRef) => Dismissal;
};
