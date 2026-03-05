import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { pcloudAuth } from '../auth';
import { pcloudCommon } from '../common';

const polling: Polling<
  { access_token: string },
  { folderId?: number }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const folderId = propsValue.folderId ?? 0;

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${pcloudCommon.baseUrl}/listfolder`,
      queryParams: {
        folderid: folderId.toString(),
        recursive: '0',
        showdeleted: '0',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    const body = result.body as {
      metadata?: { contents?: Array<Record<string, unknown>> };
    };
    const contents = body?.metadata?.contents ?? [];

    const files = contents.filter(
      (item) => !(item['isfolder'] as boolean)
    );

    return files.map((file) => ({
      epochMilliSeconds: dayjs(file['modified'] as string).valueOf(),
      data: file,
    }));
  },
};

export const pcloudNewFile = createTrigger({
  auth: pcloudAuth,
  name: 'new_file_uploaded',
  displayName: 'New File Uploaded',
  description: 'Triggers when a new file is uploaded to a folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'The folder to watch for new files. Use 0 for root folder.',
      required: false,
      defaultValue: 0,
    }),
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
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  sampleData: {
    name: 'example.pdf',
    created: '2026-01-15T10:30:00+0000',
    modified: '2026-01-15T10:30:00+0000',
    fileid: 123456789,
    size: 1048576,
    contenttype: 'application/pdf',
    isfolder: false,
    parentfolderid: 0,
  },
});
