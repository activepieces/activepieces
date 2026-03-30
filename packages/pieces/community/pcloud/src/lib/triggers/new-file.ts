import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  httpClient,
  HttpMethod,
  AuthenticationType,
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

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/listfolder',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to list folder: ${JSON.stringify(result.body)}`);
    }

    const files = result.body.metadata.contents
      ?.filter((item: any) => !item.isfolder)
      ?.map((item: any) => ({
        epochMilliSeconds: new Date(item.created).getTime(),
        data: item,
      })) || [];

    return files;
  },
};

export const pcloudNewFile = createTrigger({
  auth: pcloudAuth,
  name: 'new_file_uploaded',
  displayName: 'New File Uploaded',
  description: 'Triggered when a new file is uploaded to a folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The folder ID to monitor (use 0 for root folder)',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Folder Path',
      description: 'The folder path to monitor (e.g., /folder1). Use folderId or path.',
      required: false,
    }),
  },
  sampleData: {
    fileid: 12345678,
    name: 'example.pdf',
    path: '/Documents/example.pdf',
    size: 1024000,
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
