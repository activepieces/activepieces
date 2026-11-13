import { createAction, Property } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetSpecialFolderOutputSchema } from '../../../output-schemas';

const SPECIAL_FOLDERS = [
  { label: 'Documents', value: 'documents' },
  { label: 'Photos', value: 'photos' },
  { label: 'Camera Roll', value: 'cameraroll' },
  { label: 'App Root', value: 'approot' },
  { label: 'Music', value: 'music' },
  { label: 'Recordings', value: 'recordings' },
] as const;

export const getSpecialFolderAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_special_folder',
  outputSchema: microsoftSharepointGetSpecialFolderOutputSchema,
  displayName: 'Get Special Folder',
  description: "Gets a well-known folder of the signed-in user's OneDrive by name.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets a well-known folder (Documents, Photos, Camera Roll, App Root, Music or Recordings) of the signed-in user's OneDrive, with its item ID and drive ID for the file actions. Needs the user's OneDrive to be provisioned.",
    idempotent: true,
  },
  props: {
    name: Property.StaticDropdown({
      displayName: 'Folder',
      description: 'The special folder to get.',
      required: true,
      options: {
        disabled: false,
        options: SPECIAL_FOLDERS.map((folder) => ({ ...folder })),
      },
    }),
  },
  async run({ auth, propsValue }) {
    if (!SPECIAL_FOLDERS.some((folder) => folder.value === propsValue.name)) {
      throw new Error(
        `Folder must be one of: ${SPECIAL_FOLDERS.map((folder) => folder.value).join(', ')}.`
      );
    }
    const folder: DriveItem = await microsoftSharePointClient
      .create({ auth })
      .api(`/me/drive/special/${encodeURIComponent(propsValue.name)}`)
      .get();
    return folder;
  },
});
