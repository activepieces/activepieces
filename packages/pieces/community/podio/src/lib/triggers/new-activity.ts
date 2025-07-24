import { 
  createTrigger, 
  TriggerStrategy, 
  PiecePropValueSchema 
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioActivity } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof podioAuth>, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const isTest = lastFetchEpochMS === 0;
    const sinceDate = new Date(lastFetchEpochMS);
    
    // Get activities since last poll
    const response = await podioApiCall<PodioActivity[]>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/stream/v2/',
      query: {
        limit: isTest ? 5 : 50,
      },
    });

    const activities = Array.isArray(response) ? response : [response];
    
    // Filter activities created since last poll
    const filteredActivities = isTest ? activities : activities.filter(activity => {
      const createdDate = new Date(activity.created_on);
      return createdDate > sinceDate;
    });

    return filteredActivities.map((activity) => ({
      epochMilliSeconds: new Date(activity.created_on).getTime(),
      data: activity,
    }));
  },
};

export const newActivityTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_activity',
  displayName: 'New Activity',
  description: 'Triggers when a new activity occurs in Podio.',
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