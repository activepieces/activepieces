import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryCreateFolderOutputSchema } from '../../output-schemas';

export const cloudinaryCreateFolder = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_create_folder',
  outputSchema: cloudinaryCreateFolderOutputSchema,
  displayName: 'Create Folder',
  description: 'Creates an empty folder, including any missing parent folders.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an empty folder at the given path, creating missing parents too. Succeeds without change if the folder already exists. Returns name, path and the folder external_id.',
    idempotent: true,
  },
  props: {
    folder: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Full folder path (e.g. "marketing/banners").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.POST, `/folders/${aiResults.encodePath({ value: propsValue.folder })}`);
  },
});
