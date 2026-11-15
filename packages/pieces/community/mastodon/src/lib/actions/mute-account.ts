import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { relationshipOutputSchema } from '../output-schemas';

export const muteAccount = createAction({
  auth: mastodonAuth,
  name: 'mute_account',
  classification: 'WRITE',
  displayName: 'Mute Account',
  description: 'Hide an account\'s posts, and optionally its notifications.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Mutes an account so its posts are hidden from the connected account (the muted account is not told). Unset Mute Notifications also hides their notifications; unset Duration mutes indefinitely. Calling it on an already-muted account overwrites the existing mute\'s duration and notification setting, so pass both to keep them. Use Block Account to also stop them seeing you. Returns the relationship.',
    idempotent: true,
  },
  outputSchema: relationshipOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Local ID of the account to mute. Obtain it from Lookup Account, Search Accounts or Search (use resolve for a remote user@domain).',
      required: true,
    }),
    notifications: mastodonProps.optionalBoolean({
      displayName: 'Mute Notifications',
      description: 'Also hide notifications from this account. Leave empty for the default (yes).',
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
      description: 'How long the mute lasts, in seconds, for example 86400 for one day. Leave empty or 0 to mute indefinitely.',
      required: false,
    }),
  },
  async run(context) {
    const { account_id, notifications, duration } = context.propsValue;
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/accounts/${encodeURIComponent(account_id)}/mute`,
      operation: 'Mute Account',
      scope: 'write:mutes',
      body: {
        ...(notifications !== undefined ? { notifications } : {}),
        ...(duration !== undefined && duration !== null ? { duration } : {}),
      },
    });
  },
});
