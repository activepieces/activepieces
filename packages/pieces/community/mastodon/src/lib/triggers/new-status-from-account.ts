import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  MarkdownVariant,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  tryCatch,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonApiError } from '../common/client';
import { mastodonPolling } from '../common/polling';
import { mastodonSampleData } from '../common/sample-data';
import { statusOutputSchema } from '../output-schemas';

const props = {
  account_info: Property.MarkDown({
    value:
      'For accounts on other servers, only statuses that reach your server are seen; following the account helps.',
    variant: MarkdownVariant.INFO,
  }),
  account: Property.ShortText({
    displayName: 'Account',
    description:
      'A username on your server, or user@domain for another server. An Account ID also works.',
    placeholder: 'Gargron@mastodon.social',
    required: true,
  }),
  exclude_replies: Property.Checkbox({
    displayName: 'Skip Replies',
    description: 'Ignore the account\'s replies to other people.',
    required: false,
    defaultValue: false,
  }),
  exclude_reblogs: Property.Checkbox({
    displayName: 'Skip Boosts',
    description: 'Ignore statuses the account boosts from others.',
    required: false,
    defaultValue: false,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof mastodonAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, store, propsValue, lastItemId }) => {
    const fetchStatuses = async ({ accountId, minId }: { accountId: string; minId: string | null }) => {
      const items = await mastodonPolling.fetchNewItems({
        auth: auth.props,
        path: `/api/v1/accounts/${encodeURIComponent(accountId)}/statuses`,
        query: {
          exclude_replies: propsValue.exclude_replies === true ? true : undefined,
          exclude_reblogs: propsValue.exclude_reblogs === true ? true : undefined,
        },
        lastItemId: minId,
        operation: 'New Status from Account',
        scope: 'read:statuses',
      });
      return items.map((item) => ({
        id: mastodonPolling.encodeAccountCursor({ auth: auth.props, account: propsValue.account, accountId, statusId: item.id }),
        data: item.data,
      }));
    };
    const resolveAccount = () =>
      mastodonPolling.resolveAccountId({
        auth: auth.props,
        account: propsValue.account,
        operation: 'New Status from Account',
      });
    const cursor = mastodonPolling.decodeAccountCursor({ auth: auth.props, account: propsValue.account, cursor: lastItemId });
    if (cursor.kind === 'same_account') {
      const cached = await tryCatch(() => fetchStatuses({ accountId: cursor.accountId, minId: cursor.statusId }));
      if (cached.error === null) {
        return cached.data;
      }
      if (!(cached.error instanceof MastodonApiError) || cached.error.status !== 404) {
        throw cached.error;
      }
      return fetchStatuses({ accountId: await resolveAccount(), minId: cursor.statusId });
    }
    const latest = await fetchStatuses({ accountId: await resolveAccount(), minId: null });
    if (cursor.kind === 'none') {
      return latest;
    }
    if (latest.length > 0) {
      await store.put(LAST_ITEM_KEY, latest[0].id);
    } else {
      await store.delete(LAST_ITEM_KEY);
    }
    return [];
  },
};

const LAST_ITEM_KEY = 'lastItem';

export const newStatusFromAccount = createTrigger({
  auth: mastodonAuth,
  name: 'new_status_from_account',
  classification: 'READ',
  displayName: 'New Status from Account',
  description: 'Triggers when a chosen account publishes a new status.',
  aiMetadata: {
    description:
      'Fires once per new status published by one watched account (by handle or Account ID), optionally skipping its replies and boosts; the payload is the full status. For remote accounts only statuses federated to the connected server are visible.',
  },
  props,
  propertyGroups: [
    {
      key: 'account',
      display: 'section',
      label: 'Account to Watch',
      icon: 'user',
      props: ['account_info', 'account'],
    },
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['exclude_replies', 'exclude_reblogs'],
    },
  ],
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
