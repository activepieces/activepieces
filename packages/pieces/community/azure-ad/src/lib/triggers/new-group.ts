import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { azureAdAuth } from '../auth';
import { fetchGraphDeltaChanges } from '../common';

const STORE_KEY = '_delta_link_new_group';
const GROUP_SELECT =
  'id,displayName,description,mail,mailNickname,visibility,groupTypes,securityEnabled,mailEnabled,createdDateTime';

export const newGroupTrigger = createTrigger({
  auth: azureAdAuth,
  name: 'new_group',
  displayName: 'New Group',
  description: 'Triggers when a new group is created in Microsoft Entra ID.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    displayName: 'testGroup6',
    mailNickname: 'team-theta4',
    visibility: null,
    securityEnabled: true,
    mailEnabled: false,
    createdDateTime: '2026-04-22T08:29:29Z',
    id: '2ff8f722-0191-4c16-a378-a8fb4efec110',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
    await context.store.delete(STORE_KEY);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof azureAdAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  // /groups/delta avoids the advanced-query restrictions on $filter + createdDateTime,
  // while TIMEBASED dedup on createdDateTime ensures updates to an already-emitted group
  // don't re-fire this trigger (updated groups keep their original createdDateTime).
  // https://learn.microsoft.com/en-us/graph/delta-query-groups
  async items({ auth, store }) {
    const groups = await fetchGraphDeltaChanges<GraphGroup>({
      accessToken: auth.access_token,
      store,
      storeKey: STORE_KEY,
      deltaPath: '/groups/delta',
      select: GROUP_SELECT,
    });
    return groups
      .filter((g) => g.createdDateTime)
      .map((group) => ({
        epochMilliSeconds: dayjs(group.createdDateTime).valueOf(),
        data: group,
      }));
  },
};

type GraphGroup = {
  id: string;
  createdDateTime?: string;
  '@removed'?: unknown;
  [key: string]: unknown;
};
