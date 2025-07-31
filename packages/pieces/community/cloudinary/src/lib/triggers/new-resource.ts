
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  PiecePropValueSchema,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';

const props = {
  asset_folder: Property.ShortText({
    displayName: 'Asset Folder',
    description: 'The Cloudinary folder to watch for new resources. Leave empty to watch the entire account.',
    required: false,
  }),
};

const polling: Polling<PiecePropValueSchema<typeof cloudinaryAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    let endpoint = '/resources/image'; // Default to all resources
    
    if (propsValue.asset_folder && propsValue.asset_folder.trim()) {
      endpoint = `/resources/by_asset_folder?asset_folder=${encodeURIComponent(propsValue.asset_folder.trim())}`;
    }
    
    const resources = await makeRequest(auth, HttpMethod.GET, endpoint);
    
    return (resources.resources || []).map((item: any) => ({
      epochMilliSeconds: dayjs(item.created_at).valueOf(),
      data: item,
    }));
  },
};

export const newResourceInFolder = createTrigger({
  auth: cloudinaryAuth,
  name: 'new_resource',
  displayName: 'New Resource',
  description: 'Triggers when a new image, video, or file is uploaded to a specific folder or account in Cloudinary.',
  props,
  sampleData: {
    "asset_id": "bcace221f5b11685dd6effb9d69d5ec3",
    "public_id": "signature_snc5z4",
    "format": "png",
    "version": 1752843735,
    "resource_type": "image",
    "type": "upload",
    "created_at": "2025-07-18T13:02:15Z",
    "bytes": 13685,
    "width": 667,
    "height": 276,
    "asset_folder": "Testr",
    "display_name": "signature_snc5z4",
    "url": "http://res.cloudinary.com/dndacs7ddse/image/upload/v1752843735/signature_snc5z4.png",
    "secure_url": "https://res.cloudinary.com/dndacs7sdde/image/upload/v1752843735/signature_snc5z4.png"
  },
  type: TriggerStrategy.POLLING,
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
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});