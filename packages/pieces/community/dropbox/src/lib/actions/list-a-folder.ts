import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { listFolderOutputSchema } from '../output-schemas';

export const dropboxListAFolder = createAction({
  auth: dropboxAuth,
  name: 'list_dropbox_folder',
  classification: 'SEARCH',
  description: 'List the files and subfolders in a folder',
  audience: 'both',
  aiMetadata: { description: 'Lists the files and subfolders within the given Dropbox folder path (use an empty string for the root), optionally recursing into all subfolders. Use to enumerate folder contents and discover item paths/IDs. Read-only; safe to repeat and returns the same listing for unchanged folders.', idempotent: true },
  displayName: 'List Folder',
  outputSchema: listFolderOutputSchema,
  propertyGroups: [
    {
      key: 'folder',
      display: 'section',
      label: 'Folder',
      icon: 'file',
      props: ['path', 'recursive'],
    },
  ],
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Folder to list, starting with /. Use / for the root.',
      placeholder: '/Reports',
      required: true,
    }),
    recursive: Property.Checkbox({
      displayName: 'Include Subfolders',
      description: 'Also list everything inside subfolders.',
      defaultValue: false,
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'About how many entries to return. Empty: 2,000.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const cap = context.propsValue.limit || 2000;
    const token = context.auth.access_token;

    let lastPage = await postListFolder({
      token,
      endpoint: 'list_folder',
      body: {
        path: dropboxCommon.toApiPath(context.propsValue.path),
        recursive: context.propsValue.recursive,
        limit: Math.min(cap, 2000),
      },
    });
    let collected = lastPage.entries;

    while (lastPage.has_more && collected.length < cap) {
      lastPage = await postListFolder({
        token,
        endpoint: 'list_folder/continue',
        body: { cursor: lastPage.cursor },
      });
      collected = [...collected, ...lastPage.entries];
    }

    return { ...lastPage, entries: collected };
  },
});

async function postListFolder({
  token,
  endpoint,
  body,
}: {
  token: string;
  endpoint: string;
  body: Record<string, unknown>;
}): Promise<ListFolderBody> {
  const result = await httpClient.sendRequest<ListFolderBody>({
    method: HttpMethod.POST,
    url: `https://api.dropboxapi.com/2/files/${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  });

  return result.body;
}

type ListFolderBody = {
  entries: unknown[];
  cursor: string;
  has_more: boolean;
};
