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

type DropboxFileEntry = {
  id: string;
  name: string;
  path_lower?: string;
  path_display?: string;
  size: number;
  client_modified: string;
  server_modified: string;
  ['.tag']: string;
};

type DropboxListFolderResponse = {
  entries: DropboxFileEntry[];
  cursor: string;
  has_more: boolean;
};

type DropboxFileEntryWithLink = DropboxFileEntry & { temporary_link: string };

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

const getTemporaryLink = async (
  accessToken: string,
  path: string,
): Promise<string> => {
  const res = await httpClient.sendRequest<{ link: string }>({
    method: HttpMethod.POST,
    url: 'https://api.dropboxapi.com/2/files/get_temporary_link',
    headers: { 'Content-Type': 'application/json' },
    body: { path },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });
  return res.body.link;
};

const enrichWithLinks = async (
  accessToken: string,
  files: DropboxFileEntry[],
): Promise<DropboxFileEntryWithLink[]> => {
  return Promise.all(
    files.map(async (file) => {
      const temporary_link = file.path_lower
        ? await getTemporaryLink(accessToken, file.path_lower)
        : '';
      return { ...file, temporary_link };
    }),
  );
};

const getChangedFiles = async (
  accessToken: string,
  cursor: string,
): Promise<{ files: DropboxFileEntry[]; newCursor: string }> => {
  const files: DropboxFileEntry[] = [];
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

    const newFiles = res.body.entries.filter((e) => e['.tag'] === 'file');
    files.push(...newFiles);
    currentCursor = res.body.cursor;
    hasMore = res.body.has_more;
  }

  return { files, newCursor: currentCursor };
};

const listRecentFiles = async (
  accessToken: string,
  path: string,
  recursive: boolean,
): Promise<DropboxFileEntry[]> => {
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

  return res.body.entries.filter((e) => e['.tag'] === 'file').slice(0, 5);
};

export const dropboxNewFile = createTrigger({
  auth: dropboxAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Triggers when a new file is added inside a watched Dropbox folder.',
  aiMetadata: {
    description:
      'Fires when a new file appears inside the watched Dropbox folder path. Each event represents one newly added file and includes a temporary_link field — a short-lived direct download URL valid for 4 hours — suitable for passing to conversion or processing steps.',
  },

  type: TriggerStrategy.POLLING,

  props: {
    path: Property.ShortText({
      displayName: 'Watched Folder Path',
      description: 'Dropbox folder path to watch (e.g. /Photos). Use "" for root.',
      required: true,
      defaultValue: '',
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description: 'Watch subfolders recursively.',
      required: false,
      defaultValue: false,
    }),
  },

  sampleData: {
    '.tag': 'file',
    name: 'IMG_3157.heic',
    id: 'id:a4ayc_80_OEAAAAAAAAAXw',
    path_display: '/Photos/IMG_3157.heic',
    path_lower: '/photos/img_3157.heic',
    size: 2097152,
    client_modified: '2026-06-10T11:51:18Z',
    server_modified: '2026-06-10T11:51:18Z',
    temporary_link: 'https://dl.dropboxusercontent.com/apitl/1/example',
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

    const { files, newCursor } = await getChangedFiles(
      context.auth.access_token,
      cursor,
    );
    await context.store.put('cursor', newCursor);
    return enrichWithLinks(context.auth.access_token, files);
  },

  test: async (context) => {
    const files = await listRecentFiles(
      context.auth.access_token,
      context.propsValue.path || '',
      context.propsValue.recursive ?? false,
    );
    return enrichWithLinks(context.auth.access_token, files);
  },
});
