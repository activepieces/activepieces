import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryDestroyAssetByIdOutputSchema } from '../../output-schemas';

export const cloudinaryDestroyAssetById = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_destroy_asset_by_id',
  outputSchema: cloudinaryDestroyAssetByIdOutputSchema,
  displayName: 'Destroy Asset by Asset ID',
  description: 'Permanently deletes one asset by its immutable asset ID.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a single asset identified by its asset_id, regardless of resource type or delivery type. Returns result "ok", or "not found" when nothing matched. For several assets by public ID use Delete Resources.',
    idempotent: false,
  },
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset\'s immutable asset_id.',
      required: true,
    }),
    invalidate: aiProps.invalidate(),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.POST, '/asset/destroy', {
      asset_id: propsValue.asset_id.trim(),
      ...(propsValue.invalidate ? { invalidate: true } : {}),
    });
  },
});
