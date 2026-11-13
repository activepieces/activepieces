import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryDeleteFolderOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteFolder = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_folder',
  outputSchema: cloudinaryDeleteFolderOutputSchema,
  displayName: 'Delete Folder',
  description: 'Deletes an empty folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a folder and its empty subfolders. Fails if the folder still contains assets (including backed-up ones); delete or move those first. Returns the deleted folder paths.',
    idempotent: false,
  },
  props: {
    folder: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Full folder path (e.g. "marketing/banners").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.DELETE, `/folders/${aiResults.encodePath({ value: propsValue.folder })}`);
  },
});
