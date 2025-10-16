import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, projectIdProperty } from '../common/props';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof googleCloudStorageAuth>,
  any
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { bucket, prefix } = propsValue as any;
    const params = new URLSearchParams();
    if (prefix) params.append('prefix', prefix);
    
    let allObjects: any[] = [];
    let pageToken: string | undefined;
    
    do {
      if (pageToken) params.set('pageToken', pageToken);
      
      const response = await gcsCommon.makeRequest(
        HttpMethod.GET, 
        `/b/${bucket}/o?${params.toString()}`, 
        auth.access_token
      );
      
      const objects = response.items || [];
      allObjects.push(...objects);
      pageToken = response.nextPageToken;
    } while (pageToken);
    
    return allObjects
      .filter((obj: any) => dayjs(obj.updated).valueOf() > lastFetchEpochMS)
      .map((obj: any) => ({
        epochMilliSeconds: dayjs(obj.updated).valueOf(),
        data: obj,
      }));
  },
};

export const objectUpdated = createTrigger({
  auth: googleCloudStorageAuth,
  name: 'object_updated',
  displayName: 'Object Updated',
  description: 'Triggers when an existing object is updated in a bucket',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    prefix: Property.ShortText({
      displayName: 'Prefix Filter',
      description: 'Only trigger for objects with this prefix',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    kind: 'storage#object',
    id: 'example-bucket/example-object/1234567890',
    name: 'example-object.txt',
    bucket: 'example-bucket',
    generation: '1234567890',
    contentType: 'text/plain',
    timeCreated: '2023-01-01T00:00:00.000Z',
    updated: '2023-01-01T01:00:00.000Z',
    size: '2048',
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
    return pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});