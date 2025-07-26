import { 
  createTrigger, 
  TriggerStrategy, 
  PiecePropValueSchema 
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { appIdDropdown } from '../common/props';
import { PodioItem } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof podioAuth>, { appId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const appId = propsValue.appId;

    if (!appId) {
      return [];
    }

    const isTest = lastFetchEpochMS === 0;
    const sinceDate = new Date(lastFetchEpochMS);
    
    // Get items updated since last poll
    const response = await podioApiCall<{ items: PodioItem[] }>({
      auth,
      method: HttpMethod.POST,
      resourceUri: `/item/app/${appId}/filter/`,
      body: {
        sort_by: 'last_edit_on',
        sort_desc: true,
        limit: isTest ? 5 : 50,
        filters: isTest ? {} : {
          last_edit_on: {
            from: sinceDate.toISOString(),
          },
        },
      },
    });

    const items = response.items || [];
    
    return items.map((item) => ({
      epochMilliSeconds: new Date(item.last_edit_on || item.created_on).getTime(),
      data: item,
    }));
  },
};

export const itemUpdatedTrigger = createTrigger({
  auth: podioAuth,
  name: 'item_updated',
  displayName: 'Item Updated',
  description: 'Triggers when an item is updated in a Podio app.',
  props: {
    appId: appIdDropdown('App', true),
  },
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