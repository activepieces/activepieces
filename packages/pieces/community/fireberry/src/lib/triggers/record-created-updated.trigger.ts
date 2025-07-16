import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { validateApiResponse } from '../common/validate';

function isCustomObject(objectType: string) {
  return objectType.startsWith('custom_');
}

export const recordCreatedOrUpdatedTrigger = createTrigger({
  name: 'record_created_or_updated',
  displayName: 'Record Created/Updated',
  description: 'Fires when a new record is created or an existing record is updated in a specified object type.',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    updatedSince: Property.DateTime({
      displayName: 'Updated Since',
      required: false,
      description: 'Only fetch records updated since this date/time (optional, for first run or backfill).',
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},
  async onEnable({ store }) {
    await store.put('lastPoll', Date.now());
  },
  async onDisable({ store }) {
    await store.delete('lastPoll');
  },
  async run({ auth, propsValue, store }) {
    const client = new FireberryClient(auth as string);
    const { objectType, updatedSince } = propsValue;
    const lastFetchEpochMS = (await store.get<number>('lastPoll')) ?? 0;
    const since = lastFetchEpochMS ? new Date(lastFetchEpochMS).toISOString() : updatedSince;
    let resourceUri = '';
    let queryParams: Record<string, any> = {};
    if (isCustomObject(objectType)) {
      resourceUri = '/custom-object-records/';
      queryParams = { object: objectType };
      if (since) queryParams['updated_since'] = since;
    } else {
      resourceUri = `/${objectType}/`;
      if (since) queryParams['updated_since'] = since;
    }
    try {
      const response = await client.request({
        method: HttpMethod.GET,
        resourceUri,
        queryParams,
      });
      if (!Array.isArray(response)) {
        throw new Error('API response is not an array');
      }
      await store.put('lastPoll', Date.now());
      return response;
    } catch (error: any) {
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Authentication failed. Please check your Fireberry API key.');
      }
      throw error;
    }
  },
}); 