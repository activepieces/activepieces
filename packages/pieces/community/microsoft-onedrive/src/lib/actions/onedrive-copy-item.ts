import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { onedriveCopyItemOutputSchema } from '../output-schemas';

export const onedriveCopyItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_copy_item',
  displayName: 'Copy File or Folder',
  description:
    'Start copying a OneDrive file or folder. The copy runs in the background; check it with Get Copy Status.',
  audience: 'ai',
  outputSchema: onedriveCopyItemOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an asynchronous copy of a file or a whole folder (with its contents) into a destination folder, optionally under a new name, and returns a monitor URL rather than the new item. Next, call Get Copy Status with that monitor URL until it reports completed; its resourceId is the new copy\'s ID, while the source ID keeps pointing at the original. Each call starts another copy; name conflicts are reported by Get Copy Status as failed, and the conflict setting is not supported on personal OneDrive.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the item to copy, from Search or List Folder Contents.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path from the drive root. Use this or Item ID.',
      placeholder: 'Documents/report.docx',
      required: false,
    }),
    destinationFolderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'Folder to copy into. Leave empty for the drive root.',
      required: false,
    }),
    newName: Property.ShortText({
      displayName: 'New Name',
      description: 'Optional name for the copy. Leave empty to keep the original name.',
      required: false,
    }),
    conflictBehavior: Property.StaticDropdown({
      displayName: 'If the Name Exists',
      description: 'What to do on a name clash. Not supported on personal OneDrive.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Fail', value: 'fail' },
          { label: 'Rename the copy', value: 'rename' },
          { label: 'Replace the existing item', value: 'replace' },
        ],
      },
    }),
  },
  async run(context) {
    const { itemId, path, destinationFolderId, newName, conflictBehavior } = context.propsValue;
    const sourcePath = oneDriveApi.itemPath({ itemId, path });
    const [parentId, driveId] = await Promise.all([
      oneDriveApi.resolveFolderId({ auth: context.auth, folderId: destinationFolderId }),
      oneDriveApi.getDriveId({ auth: context.auth }),
    ]);
    const body: Record<string, unknown> = {
      parentReference: { driveId, id: parentId },
    };
    const trimmedName = newName?.trim();
    if (trimmedName) {
      body['name'] = trimmedName;
    }
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${graphBaseUrl(context.auth)}${sourcePath}/copy`,
        queryParams: conflictBehavior ? { '@microsoft.graph.conflictBehavior': conflictBehavior } : undefined,
        body,
        headers: { 'Content-Type': 'application/json' },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      const location = response.headers?.['location'];
      const monitorUrl = Array.isArray(location) ? location[0] : location;
      if (!monitorUrl) {
        throw new Error('OneDrive accepted the copy but did not return a monitor URL.');
      }
      return { monitorUrl, status: 'inProgress' };
    } catch (error) {
      throw new Error(oneDriveApi.describeError(error));
    }
  },
});

function graphBaseUrl(auth: OAuth2PropertyValue): string {
  const cloud = auth.props?.['cloud'];
  return `${getGraphBaseUrl(typeof cloud === 'string' ? cloud : undefined)}/v1.0`;
}
