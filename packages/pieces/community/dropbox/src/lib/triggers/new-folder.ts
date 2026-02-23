import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

import {
  AuthenticationType,
  DedupeStrategy,
  HttpMethod,
  HttpRequest,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';

import dayjs from 'dayjs';
import { dropboxAuth } from '../..';

type DropboxListFolderEntry = {
  id: string;
  name: string;
  path_lower?: string;
  path_display?: string;
  ['.tag']: string;
};

type DropboxListFolderResponse = {
  entries: DropboxListFolderEntry[];
  cursor: string;
  has_more: boolean;
};

const listAllFolders = async (
  accessToken: string,
  path: string,
  recursive: boolean,
  limit: number,
): Promise<DropboxListFolderEntry[]> => {
  const entries: DropboxListFolderEntry[] = [];

  let request: HttpRequest = {
    method: HttpMethod.POST,
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      path,
      recursive,
      limit,
      include_deleted: false,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  };

  let res =
    await httpClient.sendRequest<DropboxListFolderResponse>(request);

  entries.push(...(res.body.entries ?? []));

  // Handles pagination
  while (res.body.has_more) {
    const continueReq: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.dropboxapi.com/2/files/list_folder/continue',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        cursor: res.body.cursor,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    res =
      await httpClient.sendRequest<DropboxListFolderResponse>(
        continueReq,
      );

    entries.push(...(res.body.entries ?? []));
  }

  return entries.filter((e) => e['.tag'] === 'folder');
};


const polling: Polling<
  AppConnectionValueForAuthProperty<typeof dropboxAuth>,
  { path: string; recursive?: boolean }
> = {
  // Use ID-based dedupe since Dropbox folders don't have creation timestamps
  strategy: DedupeStrategy.LAST_ITEM,

  items: async ({ auth, propsValue }) => {
    const folders = await listAllFolders(
      auth.access_token,
      propsValue.path || '',
      propsValue.recursive ?? false,
      2000,
    );

    folders.sort((a, b) => b.id.localeCompare(a.id));

    return folders.map((folder) => ({
      id: folder.id,
      data: folder,
    }));
  },
};


export const dropboxNewFolder = createTrigger({
  auth: dropboxAuth,
  name: 'new_folder',
  displayName: 'New Folder',
  description:
    'Triggers when a new folder is created inside a watched Dropbox folder.',

  type: TriggerStrategy.POLLING,

  props: {
    path: Property.ShortText({
      displayName: 'Watched Folder Path',
      description:
        'Folder path to watch. Use empty string "" for root.',
      required: true,
      defaultValue: '',
    }),

    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description:
        'Watch subfolders recursively. May return many results.',
      required: false,
      defaultValue: false,
    }),
  },

  sampleData: {
    '.tag': 'folder',
    name: 'Project Docs',
    id: 'id:a4ayc_80_OEAAAAAAAAAXw',
    path_display: '/Work/Project Docs',
    path_lower: '/work/project docs',
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
    return await pollingHelper.poll(polling, context);
  },

  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },
});
