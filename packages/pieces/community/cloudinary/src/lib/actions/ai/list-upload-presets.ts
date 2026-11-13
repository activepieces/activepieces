import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListUploadPresetsOutputSchema } from '../../output-schemas';

export const cloudinaryListUploadPresets = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_upload_presets',
  outputSchema: cloudinaryListUploadPresetsOutputSchema,
  displayName: 'List Upload Presets',
  description: 'Lists the upload presets defined in the account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists upload presets (name, unsigned flag and settings). Pass a preset name to Upload Asset to apply its folder, tags, transformations and other upload settings. Pages with next_cursor.',
    idempotent: true,
  },
  props: {
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: PresetList = await makeRequest(auth, HttpMethod.GET, '/upload_presets', undefined, {
      max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
      next_cursor: propsValue.next_cursor,
    });
    return { presets: response.presets, count: response.presets.length, next_cursor: response.next_cursor ?? null };
  },
});

type PresetList = { presets: Record<string, unknown>[]; next_cursor?: string };
