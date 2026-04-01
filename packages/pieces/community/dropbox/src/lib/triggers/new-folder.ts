import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';

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

// Returns the latest cursor for a folder without fetching any entries.
// Designed for apps that only need to know about new changes going forward.
const getLatestCursor = async (
  accessToken: string,
  path: string,
  recursive: boolean,
): Promise<string> => {
  const res = await httpClient.sendRequest<{ cursor: string }>({
    method: HttpMethod.POST,
    url: 'https://api.dropboxapi.com/2/files/list_folder/get_latest_cursor',
    headers: { 'Content-Type': 'application/json' },
    body: { path, recursive, include_deleted: false },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });
  return res.body.cursor;
};

// Calls list_folder/continue with a stored cursor and returns all new folder entries,
// plus the updated cursor to store for the next poll.
const getChangedFolders = async (
  accessToken: string,
  cursor: string,
): Promise<{ folders: DropboxListFolderEntry[]; newCursor: string }> => {
  const folders: DropboxListFolderEntry[] = [];
  let currentCursor = cursor;
  let hasMore = true;

  while (hasMore) {
    const res = await httpClient.sendRequest<DropboxListFolderResponse>({
      method: HttpMethod.POST,
      url: 'https://api.dropboxapi.com/2/files/list_folder/continue',
      headers: { 'Content-Type': 'application/json' },
      body: { cursor: currentCursor },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    });

    const newFolders = res.body.entries.filter((e) => e['.tag'] === 'folder');
    folders.push(...newFolders);
    currentCursor = res.body.cursor;
    hasMore = res.body.has_more;
  }

  return { folders, newCursor: currentCursor };
};

// Fetches recent folder entries for test mode — returns up to 5.
const listRecentFolders = async (
  accessToken: string,
  path: string,
  recursive: boolean,
): Promise<DropboxListFolderEntry[]> => {
  const res = await httpClient.sendRequest<DropboxListFolderResponse>({
    method: HttpMethod.POST,
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    headers: { 'Content-Type': 'application/json' },
    body: { path, recursive, include_deleted: false, limit: 100 },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });

  return res.body.entries.filter((e) => e['.tag'] === 'folder').slice(0, 5);
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
      description: 'Folder path to watch. Use empty string "" for root.',
      required: true,
      defaultValue: '',
    }),

    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description: 'Watch subfolders recursively. May return many results.',
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
    const cursor = await getLatestCursor(
      context.auth.access_token,
      context.propsValue.path || '',
      context.propsValue.recursive ?? false,
    );
    await context.store.put('cursor', cursor);
  },

  onDisable: async (context) => {
    await context.store.delete('cursor');
  },

  run: async (context) => {
    const cursor = await context.store.get<string>('cursor');
    if (!cursor) return [];

    const { folders, newCursor } = await getChangedFolders(
      context.auth.access_token,
      cursor,
    );
    await context.store.put('cursor', newCursor);
    return folders;
  },

  test: async (context) => {
    return listRecentFolders(
      context.auth.access_token,
      context.propsValue.path || '',
      context.propsValue.recursive ?? false,
    );
  },
});
