import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const newOrganization = createTrigger({
  auth: zendeskAuth,
  name: 'new_organization',
  displayName: 'New Organization',
  description: 'Triggers when a new organization record is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 8193599387420,
    url: 'https://activepieceshelp.zendesk.com/api/v2/organizations/8193599387420.json',
    external_id: null,
    name: 'Organization Name',
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
    domain_names: ['example.com'],
    details: 'Organization details',
    notes: 'Organization notes',
    group_id: null,
    shared_tickets: false,
    shared_comments: false,
    tags: [],
    organization_fields: [],
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

const polling: Polling<AuthProps, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const items = await getOrganizations(auth);
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

async function getOrganizations(authentication: AuthProps) {
  const { email, token, subdomain } = authentication;
  const response = await httpClient.sendRequest<{ organizations: Array<{ id: number; name: string }> }>({
    url: `https://${subdomain}.zendesk.com/api/v2/organizations.json?sort_order=desc&sort_by=created_at&per_page=200`,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  return response.body.organizations;
} 