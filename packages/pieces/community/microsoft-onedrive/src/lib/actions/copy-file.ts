import {
  createAction,
  DropdownOption,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { Client, PageCollection, ResponseType } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { oneDriveAuth } from '../auth';
import { oneDriveCommon } from '../common/common';

export const copyFile = createAction({
  auth: oneDriveAuth,
  name: 'copy_file',
  displayName: 'Copy File',
  description: 'Create a copy of a file in your OneDrive, optionally in a different folder or with a new name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a copy of a OneDrive file, optionally into a different folder and/or under a new name, and returns the copied item once the asynchronous copy completes. Use to duplicate a file or stamp out copies of a template document. Not idempotent: each run creates another copy — with the default rename conflict behavior, repeated runs produce numbered duplicates.',
    idempotent: false,
  },
  props: {
    markdown: oneDriveCommon.parentFolderInfo,
    sourceFolderId: oneDriveCommon.folderDropdown({
      displayName: 'Source Folder',
      description: 'The folder containing the file to copy. Leave empty to browse files in the root folder.',
    }),
    fileId: Property.Dropdown({
      auth: oneDriveAuth,
      displayName: 'File',
      description:
        'The file to copy. If the file is not listed (up to 1000 files are fetched), toggle the dynamic input (F) and enter the file ID directly.',
      required: true,
      refreshers: ['sourceFolderId'],
      options: async ({ auth, sourceFolderId }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        const authValue = auth as OAuth2PropertyValue;
        const cloud = authValue.props?.['cloud'] as string | undefined;
        const client = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: () => Promise.resolve(authValue.access_token),
          },
          baseUrl: getGraphBaseUrl(cloud),
        });

        const folderId = sourceFolderId || 'root';
        const options: DropdownOption<string>[] = [];

        // A page can be empty (or contain only folders) and still carry
        // @odata.nextLink, so keep following the link instead of stopping
        // at the first empty page.
        let response: PageCollection | undefined = await client
          .api(`/me/drive/items/${folderId}/children`)
          .select('id,name,file')
          .get();

        while (response && options.length < MAX_DROPDOWN_FILES) {
          for (const item of (response.value ?? []) as DriveItem[]) {
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
      displayName: 'Destination Folder',
      description: 'The folder to copy the file into. Leave empty to copy it into the same folder as the source file.',
    }),
    newName: Property.ShortText({
      displayName: 'New Name',
      description: 'A new name for the copied file (e.g. report-copy.xlsx). If left empty, the original name is used.',
      required: false,
    }),
    conflictBehavior: Property.StaticDropdown({
      displayName: 'Conflict Behavior',
      description:
        'What to do if a file with the same name already exists in the destination folder. Note: personal OneDrive (consumer) accounts do not support this option and may fail on name conflicts regardless of the selection.',
      required: true,
      defaultValue: 'rename',
      options: {
        options: [
          { label: 'Rename with a number', value: 'rename' },
          { label: 'Overwrite existing file', value: 'replace' },
          { label: 'Fail on conflict', value: 'fail' },
        ],
      },
    }),
  },
  async run(context) {
    const { fileId, destinationFolderId, newName, conflictBehavior } = context.propsValue;
    const cloud = context.auth.props?.['cloud'] as string | undefined;

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
      // Docs: "The parentReference parameter should include the driveId and id
      // parameters for the target folder."
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
