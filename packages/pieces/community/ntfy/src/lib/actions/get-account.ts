import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ntfyAuth } from '../auth';
import { ntfyClient } from '../common/client';
import { accountOutputSchema } from '../output-schemas';

export const getAccount = createAction({
  auth: ntfyAuth,
  name: 'ntfy_get_account',
  classification: 'READ',
  displayName: 'Get Account',
  description: 'Get the ntfy account behind the connection, with its limits and usage today.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the ntfy account the connection uses (or the anonymous visitor when there is no token): username, role, tier, daily limits and how much of each was used today, plus reserved topic names. Use to check remaining message/email quota or attachment size limits before publishing. Never returns tokens, emails or phone numbers. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: accountOutputSchema,
  async run({ auth }) {
    const response = await ntfyClient.request<AccountResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/v1/account',
    });
    const account = response.body ?? {};
    const limits = account.limits ?? {};
    const stats = account.stats ?? {};
    return {
      username: account.username ?? null,
      role: account.role ?? null,
      tier_code: account.tier?.code ?? null,
      tier_name: account.tier?.name ?? null,
      limits_basis: limits.basis ?? null,
      limits_messages: limits.messages ?? null,
      limits_messages_expiry_duration: limits.messages_expiry_duration ?? null,
      limits_emails: limits.emails ?? null,
      limits_calls: limits.calls ?? null,
      limits_reservations: limits.reservations ?? null,
      limits_attachment_file_size: limits.attachment_file_size ?? null,
      limits_attachment_total_size: limits.attachment_total_size ?? null,
      limits_attachment_expiry_duration: limits.attachment_expiry_duration ?? null,
      limits_attachment_bandwidth: limits.attachment_bandwidth ?? null,
      stats_messages: stats.messages ?? null,
      stats_messages_remaining: stats.messages_remaining ?? null,
      stats_emails: stats.emails ?? null,
      stats_emails_remaining: stats.emails_remaining ?? null,
      stats_calls: stats.calls ?? null,
      stats_calls_remaining: stats.calls_remaining ?? null,
      stats_reservations: stats.reservations ?? null,
      stats_reservations_remaining: stats.reservations_remaining ?? null,
      stats_attachment_total_size: stats.attachment_total_size ?? null,
      stats_attachment_total_size_remaining: stats.attachment_total_size_remaining ?? null,
      reserved_topics: (account.reservations ?? []).map((r) => r.topic).join(','),
    };
  },
});

type AccountResponse = {
  username?: string;
  role?: string;
  tier?: { code?: string; name?: string };
  limits?: Partial<Record<LimitKey, number>> & { basis?: string };
  stats?: Partial<Record<StatKey, number>>;
  reservations?: { topic: string }[];
};

type LimitKey =
  | 'messages'
  | 'messages_expiry_duration'
  | 'emails'
  | 'calls'
  | 'reservations'
  | 'attachment_total_size'
  | 'attachment_file_size'
  | 'attachment_expiry_duration'
  | 'attachment_bandwidth';

type StatKey =
  | 'messages'
  | 'messages_remaining'
  | 'emails'
  | 'emails_remaining'
  | 'calls'
  | 'calls_remaining'
  | 'reservations'
  | 'reservations_remaining'
  | 'attachment_total_size'
  | 'attachment_total_size_remaining';
