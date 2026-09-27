import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonPolling } from '../common/polling';
import { mastodonSampleData } from '../common/sample-data';
import { statusOutputSchema } from '../output-schemas';

const props = {
  account: Property.ShortText({
    displayName: 'Account',
    description:
      'The handle of the account to watch, for example Gargron@mastodon.social (or just Gargron for an account on your own server). An Account ID from Lookup Account also works.',
    required: true,
  }),
  exclude_replies: Property.Checkbox({
    displayName: 'Skip Replies',
    description: 'Do not trigger for replies the account posts to other people.',
    required: false,
    defaultValue: false,
  }),
  exclude_reblogs: Property.Checkbox({
    displayName: 'Skip Boosts',
    description: 'Do not trigger when the account boosts someone else\'s post.',
    required: false,
    defaultValue: false,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof mastodonAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const accountId = await mastodonPolling.resolveAccountId({
      auth: auth.props,
      account: propsValue.account,
      operation: 'New Status from Account',
    });
    return mastodonPolling.fetchNewItems({
      auth: auth.props,
      path: `/api/v1/accounts/${encodeURIComponent(accountId)}/statuses`,
      query: {
        exclude_replies: propsValue.exclude_replies === true ? true : undefined,
        exclude_reblogs: propsValue.exclude_reblogs === true ? true : undefined,
      },
      lastItemId,
      operation: 'New Status from Account',
      scope: 'read:statuses',
    });
  },
};

export const newStatusFromAccount = createTrigger({
  auth: mastodonAuth,
  name: 'new_status_from_account',
  classification: 'READ',
  displayName: 'New Status from Account',
  description:
    'Triggers when a specific account publishes a new post. For accounts on other servers, only posts that reach your server are seen, so following the account makes this reliable.',
  aiMetadata: {
    description:
      'Fires once per new status published by one watched account (by handle or Account ID), optionally skipping its replies and boosts; the payload is the full status. For remote accounts only statuses federated to the connected server are visible.',
  },
  props,
  sampleData: mastodonSampleData.status,
  outputSchema: statusOutputSchema,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
