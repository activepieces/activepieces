import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  HttpMethod,
  httpClient,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

interface ZendeskGroup {
  id: number;
  url: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

type ZendeskAuthValue = AppConnectionValueForAuthProperty<typeof zendeskAuth>;

const polling: Polling<ZendeskAuthValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await httpClient.sendRequest<{ groups: ZendeskGroup[] }>({
      url: `https://${auth.props.subdomain}.zendesk.com/api/v2/groups?sort=-created_at`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.props.email + '/token',
        password: auth.props.token,
      },
    });

    return response.body.groups.map((group) => ({
      epochMilliSeconds: new Date(group.created_at).getTime(),
      data: group,
    }));
  },
};

export const newGroup = createTrigger({
  name: 'new_group',
  displayName: 'New Group',
  description: 'Fires when a new group is created.',
  aiMetadata: {
    description: 'Fires when a new support group is created in Zendesk. Represents a newly added team or support department. Polls for newly created groups since Zendesk does not emit a webhook event for group creation.',
  },
  auth: zendeskAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 12345,
    url: 'https://example.zendesk.com/api/v2/groups/12345.json',
    name: 'Support Team',
    description: 'Main support team',
    is_public: true,
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
