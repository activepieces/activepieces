import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveItemOutputSchema } from '../output-schemas';

export const onedriveGetSpecialFolder = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_get_special_folder',
  displayName: 'Get Special Folder',
  description: 'Get a well-known OneDrive folder such as Documents or Photos.',
  audience: 'ai',
  outputSchema: onedriveItemOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Resolve a well-known OneDrive folder (Documents, Photos, Camera Roll, Music, Recordings) to its folder ID, whatever its localized name is. Use it before listing or uploading into one of these folders instead of guessing a path. If the folder does not exist yet, OneDrive creates it on first access; later calls return the same folder, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    folder: Property.StaticDropdown({
      displayName: 'Folder',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Documents', value: 'documents' },
          { label: 'Photos', value: 'photos' },
          { label: 'Camera Roll', value: 'cameraroll' },
          { label: 'Music', value: 'music' },
          { label: 'Recordings', value: 'recordings' },
        ],
      },
    }),
  },
  async run(context) {
    const { folder } = context.propsValue;
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/me/drive/special/${encodeURIComponent(folder)}`,
    });
    return oneDriveApi.toItem(item);
  },
});
