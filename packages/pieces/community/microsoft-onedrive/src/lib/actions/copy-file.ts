import {
  createAction,
  DropdownOption,
  Property,
} from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/pieces-framework';
import { Client, PageCollection, ResponseType } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { getCloudProp, getGraphBaseUrl } from '../common/microsoft-cloud';
import { oneDriveAuth } from '../auth';
import { oneDriveCommon } from '../common/common';
import { copyFileOutputSchema } from '../output-schemas';

export const copyFile = createAction({
  auth: oneDriveAuth,
  name: 'copy_file',
  classification: 'WRITE',
  displayName: 'Copy File',
  outputSchema: copyFileOutputSchema,
  description: 'Create a copy of a file in your OneDrive, optionally in a different folder or with a new name.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a copy of a OneDrive file, optionally into a different folder and/or under a new name, and returns the copied item once the asynchronous copy completes. Use to duplicate a file or stamp out copies of a template document. Not idempotent: each run creates another copy — with the default rename conflict behavior, repeated runs produce numbered duplicates.',
    idempotent: false,
  },
  props: {
    markdown: oneDriveCommon.parentFolderInfo,
    sourceFolderId: oneDriveCommon.folderDropdown({
      displayName: 'Source Folder',
      description: 'Folder to browse for the file. Empty: the root folder.',
    }),
    fileId: Property.Dropdown({
      auth: oneDriveAuth,
      displayName: 'File',
      description: 'Lists files in the Source Folder, up to 1,000.',
      required: true,
      refreshers: ['sourceFolderId'],
      options: async ({ auth, sourceFolderId }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const authValue = auth;
        const cloud = getCloudProp(authValue);
        const client = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: () => Promise.resolve(authValue.access_token),
          },
          baseUrl: getGraphBaseUrl(cloud),
        });

        const folderId = sourceFolderId || 'root';
        const options: DropdownOption<string>[] = [];

        let response: PageCollection | undefined = await client
          .api(`/me/drive/items/${folderId}/children`)
          .select('id,name,file')
          .get();

        while (response && options.length < MAX_DROPDOWN_FILES) {
          const items: DriveItem[] = response.value ?? [];
          for (const item of items) {
            if (item.file) {
              options.push({ label: item.name!, value: item.id! });
            }
          }
          const nextLink = response['@odata.nextLink'];
          response = nextLink ? await client.api(nextLink).get() : undefined;
        }

        return { disabled: false, options };
      },
    }),
    destinationFolderId: oneDriveCommon.folderDropdown({
      displayName: 'Folder',
      description: 'Empty: same folder as the original. Not listed? Use ƒ.',
      width: 'half',
    }),
    newName: Property.ShortText({
      displayName: 'New Name',
      description: 'Leave empty to keep the original name.',
      placeholder: 'report-copy.xlsx',
      width: 'half',
      required: false,
    }),
    conflictBehavior: Property.StaticDropdown({
      displayName: 'If the Name Is Taken',
      description: 'Not supported on personal OneDrive; a name clash may fail.',
      display: 'cards',
      required: true,
      defaultValue: 'rename',
      options: {
        options: [
          { label: 'Rename', value: 'rename', description: 'Add a number', icon: 'tag' },
          { label: 'Overwrite', value: 'replace', description: 'Replace it', icon: 'file' },
          { label: 'Fail', value: 'fail', description: 'Stop', icon: 'blank' },
        ],
      },
    }),
  },
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'File to Copy',
      icon: 'file',
      props: ['markdown', 'sourceFolderId', 'fileId'],
    },
    {
      key: 'destination',
      display: 'section',
      label: 'Copy To',
      icon: 'send',
      props: ['destinationFolderId', 'newName', 'conflictBehavior'],
    },
  ],
  async run(context) {
    const { fileId, destinationFolderId, newName, conflictBehavior } = context.propsValue;
    const cloud = getCloudProp(context.auth);

    if (!fileId) {
      throw new Error('Please select a file to copy.');
    }

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    const body: { parentReference?: { driveId: string; id: string }; name?: string } = {};
    if (destinationFolderId) {
      const drive = await client.api('/me/drive').select('id').get();
      body.parentReference = { driveId: drive.id, id: destinationFolderId };
    }
    if (newName) {
      body.name = newName;
    }

    let initialResponse;
    try {
      initialResponse = await client
        .api(`/me/drive/items/${fileId}/copy`)
        .responseType(ResponseType.RAW)
        .query({ '@microsoft.graph.conflictBehavior': conflictBehavior })
        .post(body);
    } catch (error) {
      throw new Error(`Failed to start copy operation: ${describeGraphError(error)}`);
    }

    if (!initialResponse.ok) {
      const { data: errorBody } = await tryCatch(() => initialResponse.json());
      throw new Error(
        `Failed to start copy operation (HTTP ${initialResponse.status}): ${describeGraphError(errorBody)}`,
      );
    }

    const monitorUrl = initialResponse.headers.get('Location');
    if (!monitorUrl) {
      throw new Error('Could not get the monitor URL from the copy operation response.');
    }

    let attempts = Math.floor((POLLING_TIMEOUT_SECS * 1000) / POLLING_DELAY_MS);
    while (attempts > 0) {
      const monitorResponse = await client.api(monitorUrl).get();

      if (monitorResponse.status === 'completed') {
        const newFile: DriveItem = await client.api(`/me/drive/items/${monitorResponse.resourceId}`).get();
        return {
          success: true,
          status: 'completed',
          resourceId: monitorResponse.resourceId,
          file: newFile,
        };
      }
      if (monitorResponse.status === 'failed') {
        throw new Error(`Copy operation failed: ${describeGraphError(monitorResponse.error)}`);
      }

      await delay(POLLING_DELAY_MS);
      attempts--;
    }

    throw new Error(
      `Copy operation did not finish within ${POLLING_TIMEOUT_SECS} seconds. It may still complete in OneDrive; you can monitor it at: ${monitorUrl}`,
    );
  },
});

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeGraphError(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'Unknown error';
  }
  if ('error' in error && typeof error.error === 'object' && error.error !== null) {
    return describeGraphError(error.error);
  }
  if ('details' in error && Array.isArray(error.details) && error.details.length > 0) {
    return error.details.map((detail) => describeGraphError(detail)).join(', ');
  }
  const code = 'code' in error && typeof error.code === 'string' ? error.code : null;
  const message =
    'message' in error && typeof error.message === 'string' && error.message.length > 0
      ? error.message
      : null;
  if (code && message) {
    return `${code}: ${message}`;
  }
  return message ?? code ?? 'Unknown error';
}

const POLLING_DELAY_MS = 2000;
const POLLING_TIMEOUT_SECS = 120;
const MAX_DROPDOWN_FILES = 1000;
