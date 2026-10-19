import { t } from 'i18next';

import { mutationFeedback } from '@/lib/mutation-feedback';

async function sendAll<T>({
  emails,
  invite,
}: {
  emails: string[];
  invite: (email: string) => Promise<T>;
}): Promise<InvitationOutcome<T>> {
  const results = await Promise.allSettled(emails.map(invite));
  const sent = results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  const failed = results.flatMap((result, index) =>
    result.status === 'rejected'
      ? [
          {
            email: emails[index],
            error: result.reason,
            reason: mutationFeedback.message(result.reason),
          },
        ]
      : [],
  );
  const quota = failed.find(({ error }) =>
    mutationFeedback.isQuotaExceeded(error),
  );
  if (sent.length === 0 && quota) {
    throw quota.error;
  }
  if (sent.length === 0 && failed.length === 1) {
    throw failed[0].error;
  }
  return { sent, failed };
}

function partialFailureCopy({
  sentCount,
  failedCount,
}: {
  sentCount: number;
  failedCount: number;
}): { title: string; description: string } {
  return {
    title: t('invitationsSentOfTotal', {
      sent: sentCount,
      total: sentCount + failedCount,
    }),
    description: t('invitationsFailedCheck', { count: failedCount }),
  };
}

export const sendInvitations = { sendAll, partialFailureCopy };

export type FailedInvitation = {
  email: string;
  error: unknown;
  reason: string;
};

export type InvitationOutcome<T> = {
  sent: T[];
  failed: FailedInvitation[];
};
