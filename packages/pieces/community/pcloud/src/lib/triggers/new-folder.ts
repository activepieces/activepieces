import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  Property,
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof pcloudAuth>,
  { folderId?: number; path?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const params: Record<string, any> = {};
    
    if (propsValue.folderId !== undefined) {
      params.folderid = propsValue.folderId;
    } else if (propsValue.path) {
      params.path = propsValue.path;
    } else {
      params.folderid = 0;
    }

    const result = await fetch(`https://api.pcloud.com/listfolder?${new URLSearchParams(params)}`, {
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    const data = await result.json();

    if (data.result !== 0) {
      throw new Error(`Failed to list folder: ${JSON.stringify(data)}`);
    }

    const folders = data.metadata.contents
      ?.filter((item: any) => item.isfolder)
      ?.map((item: any) => ({
        epochMilliSeconds: new Date(item.created).getTime(),
        data: item,
      })) || [];

    return folders;
  },
};

export const pcloudNewFolder = createTrigger({
  auth: pcloudAuth,
  name: 'folder_created',
  displayName: 'Folder Created',
  description: 'Triggered when a new folder is created',
  props: {
    folderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The parent folder ID to monitor (use 0 for root folder)',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Parent Folder Path',
      description: 'The parent folder path to monitor. Use folderId or path.',
      required: false,
    }),
  },
  sampleData: {
    folderid: 87654321,
    name: 'New Project',
    path: '/Projects/New Project',
    created: '2024-01-15T10:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
