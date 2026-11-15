import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
  audience: 'both',
  aiMetadata: {
    description:
      'Follows an account as the connected account (for a locked account this sends a follow request); the target is notified. Calling it again on an account you already follow does not error and just updates the boost, notification and language options. Returns the relationship.',
    idempotent: true,
  },
  outputSchema: relationshipOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the account, for example from Lookup Account or New Follower.',
      placeholder: '109302436954721982',
      required: true,
    }),
    follow_info: Property.MarkDown({
      value: 'Following an account you already follow only updates these options.',
      variant: MarkdownVariant.INFO,
    }),
    reblogs: mastodonProps.optionalBoolean({
      displayName: 'Show Their Boosts',
      description: 'Show their boosts in your home timeline. Empty means yes.',
    }),
    notify: mastodonProps.optionalBoolean({
      displayName: 'Notify When They Post',
      description: 'Get a notification for each of their statuses. Empty means no.',
    }),
    languages: Property.Array({
      displayName: 'Languages',
      description: 'Only show their statuses in these language codes. Empty shows all.',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'target', display: 'section', label: 'Account to Follow', icon: 'user', props: ['account_id'] },
    {
      key: 'options',
      display: 'section',
      label: 'Options',
      icon: 'sliders',
      props: ['follow_info', 'reblogs', 'notify', 'languages'],
    },
  ],
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
