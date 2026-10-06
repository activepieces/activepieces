import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { cloudinaryGetResourceByAssetIdOutputSchema } from '../../output-schemas';

export const cloudinaryGetResourceByAssetId = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_resource_by_asset_id',
  outputSchema: cloudinaryGetResourceByAssetIdOutputSchema,
  displayName: 'Get Resource by Asset ID',
  description: 'Gets the full details of one asset by its immutable asset ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the full details of one asset by its asset_id, the immutable 32-character ID returned by upload, list and search that survives renames and moves. Use Get Resource when you only have the public ID. Fails with Not found when the asset does not exist.',
    idempotent: true,
  },
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset\'s immutable asset_id.',
      required: true,
    }),
    include_colors: aiProps.includeFlag({ displayName: 'Include Colors', description: 'Include the predominant colors and color histogram (images only).' }),
    include_media_metadata: aiProps.includeFlag({ displayName: 'Include Media Metadata', description: 'Include IPTC, XMP and detailed Exif metadata.' }),
    include_faces: aiProps.includeFlag({ displayName: 'Include Faces', description: 'Include detected face coordinates (images only).' }),
    include_quality_analysis: aiProps.includeFlag({ displayName: 'Include Quality Analysis', description: 'Include the quality analysis score (images only).' }),
    include_versions: aiProps.includeFlag({ displayName: 'Include Versions', description: 'Include backed-up versions of the asset, when backups are enabled.' }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.GET, `/resources/${encodeURIComponent(propsValue.asset_id.trim())}`, undefined, {
        colors: propsValue.include_colors || undefined,
        media_metadata: propsValue.include_media_metadata || undefined,
        faces: propsValue.include_faces || undefined,
        quality_analysis: propsValue.include_quality_analysis || undefined,
        versions: propsValue.include_versions || undefined,
      });
  },
});
