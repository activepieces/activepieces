import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryGetConfigOutputSchema } from '../../output-schemas';

export const cloudinaryGetConfig = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_config',
  outputSchema: cloudinaryGetConfigOutputSchema,
  displayName: 'Get Environment Config',
  description: 'Gets the product environment configuration, such as the folder mode.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the cloud name and environment settings, notably folder_mode ("dynamic" or "fixed"). Check it before folder operations: asset folders, Rename Folder and List Resources by Asset Folder need dynamic mode; on fixed mode, folders are public ID prefixes.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return makeRequest(auth, HttpMethod.GET, '/config', undefined, { settings: true });
  },
});
