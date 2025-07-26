import { 
  createTrigger, 
  TriggerStrategy, 
  PiecePropValueSchema 
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioOrganization } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof podioAuth>, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const isTest = lastFetchEpochMS === 0;
    const sinceDate = new Date(lastFetchEpochMS);
    
    // Get all organizations and filter by creation date
    const response = await podioApiCall<PodioOrganization[]>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/org/',
    });

    const orgs = Array.isArray(response) ? response : [response];
    
    // Filter organizations created since last poll
    const filteredOrgs = isTest ? orgs.slice(0, 5) : orgs.filter(org => {
      const createdDate = new Date(org.created_on);
      return createdDate > sinceDate;
    });

    return filteredOrgs.map((org) => ({
      epochMilliSeconds: new Date(org.created_on).getTime(),
      data: org,
    }));
  },
};

export const newOrganizationTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_organization',
  displayName: 'New Organization',
  description: 'Triggers when a new organization is created in Podio.',
  props: {},
  type: TriggerStrategy.POLLING,
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
  sampleData: {},
});