import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryGetUploadPresetOutputSchema } from '../../output-schemas';

export const cloudinaryGetUploadPreset = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_upload_preset',
  displayName: 'Get Upload Preset',
  description: 'Gets one upload preset\'s settings by name.',
  audience: 'ai',
  outputSchema: cloudinaryGetUploadPresetOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one upload preset\'s name, unsigned flag and settings (folder, tags, transformations, moderation, etc.). Names come from List Upload Presets.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Preset Name',
      description: 'The upload preset name.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.GET, `/upload_presets/${encodeURIComponent(propsValue.name.trim())}`);
  },
});
