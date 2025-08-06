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
import { zendeskAuth } from '../../index';
import { ZendeskAuthProps, ZendeskOrganization } from '../common/types';
import { sampleOrganization } from '../common/sample-data';

export const newOrganization = createTrigger({
  auth: zendeskAuth,
  name: 'new_organization',
  displayName: 'New Organization',
  description: 'Fires when a new organization record is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: sampleOrganization,
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

const polling: Polling<ZendeskAuthProps, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const organizations = await getNewOrganizations(auth);
    return organizations.map((org) => ({
      id: org.id,
      data: org,
    }));
  },
};

async function getNewOrganizations(authentication: ZendeskAuthProps) {
  const { email, token, subdomain } = authentication;
  
  const url = `https://${subdomain}.zendesk.com/api/v2/organizations.json?sort_order=desc&sort_by=created_at&per_page=100`;

  const response = await httpClient.sendRequest<{ organizations: ZendeskOrganization[] }>({
    url,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  
  return response.body.organizations;
}