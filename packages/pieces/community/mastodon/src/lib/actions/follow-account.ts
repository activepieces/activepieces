import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import {
  MastodonEntity,
  mastodonClient,
  mastodonProps,
  mastodonUtils,
} from '../common/client';
import { relationshipOutputSchema } from '../output-schemas';

export const followAccount = createAction({
  auth: mastodonAuth,
  name: 'follow_account',
  classification: 'WRITE',
  displayName: 'Follow Account',
  description: 'Follow an account, or send a follow request to a locked account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Follows an account as the connected account (for a locked account this sends a follow request); the target is notified. Calling it again on an account you already follow does not error and just updates the boost, notification and language options. Returns the relationship.',
    idempotent: true,
  },
  outputSchema: relationshipOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Local ID of the account to follow. Obtain it from Lookup Account, Search Accounts or Search (use resolve for a remote user@domain).',
      required: true,
    }),
    reblogs: mastodonProps.optionalBoolean({
      displayName: 'Show Their Boosts',
      description: 'Whether their boosts appear in your home timeline. Leave empty for the default (yes).',
    }),
    notify: mastodonProps.optionalBoolean({
      displayName: 'Notify When They Post',
      description: 'Whether to get a notification for each of their posts. Leave empty for the default (no).',
    }),
    languages: Property.Array({
      displayName: 'Languages',
      description:
        'Only show their posts in these ISO 639-1 languages, one code per item (for example en). Leave empty for all languages.',
      required: false,
    }),
  },
  async run(context) {
    const { account_id, reblogs, notify, languages } = context.propsValue;
    const languageCodes = mastodonUtils.toStringArray(languages);
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/accounts/${encodeURIComponent(account_id)}/follow`,
      operation: 'Follow Account',
      scope: 'write:follows',
      body: {
        ...(reblogs !== undefined ? { reblogs } : {}),
        ...(notify !== undefined ? { notify } : {}),
        ...(languageCodes !== undefined ? { languages: languageCodes } : {}),
      },
    });
  },
});
