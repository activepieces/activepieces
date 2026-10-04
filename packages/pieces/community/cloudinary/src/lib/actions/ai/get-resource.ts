import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { cloudinaryGetResourceOutputSchema } from '../../output-schemas';

export const cloudinaryGetResource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_resource',
  outputSchema: cloudinaryGetResourceOutputSchema,
  displayName: 'Get Resource',
  description: 'Gets the full details of one asset by its public ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the full details of one asset (URLs, format, size, dimensions, tags, context, structured metadata, derived versions) by resource type, delivery type and public ID. Use Get Resource by Asset ID when you hold the immutable asset_id instead. Fails with Not found when the asset does not exist.',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    public_id: Property.ShortText({
      displayName: 'Public ID',
      description: 'The asset\'s public ID, without file extension for images and videos (e.g. "products/shoe").',
      required: true,
    }),
    include_colors: aiProps.includeFlag({ displayName: 'Include Colors', description: 'Include the predominant colors and color histogram (images only).' }),
    include_media_metadata: aiProps.includeFlag({ displayName: 'Include Media Metadata', description: 'Include IPTC, XMP and detailed Exif metadata.' }),
    include_faces: aiProps.includeFlag({ displayName: 'Include Faces', description: 'Include detected face coordinates (images only).' }),
    include_quality_analysis: aiProps.includeFlag({ displayName: 'Include Quality Analysis', description: 'Include the quality analysis score (images only).' }),
    include_versions: aiProps.includeFlag({ displayName: 'Include Versions', description: 'Include backed-up versions of the asset, when backups are enabled.' }),
  },
  async run({ auth, propsValue }) {
    const type = propsValue.type ?? 'upload';
    const publicId = propsValue.public_id.trim();
    return makeRequest(auth, HttpMethod.GET, `/resources/${propsValue.resource_type}/${type}/${publicId.split('/').map(encodeURIComponent).join('/')}`, undefined, {
        colors: propsValue.include_colors || undefined,
        media_metadata: propsValue.include_media_metadata || undefined,
        faces: propsValue.include_faces || undefined,
        quality_analysis: propsValue.include_quality_analysis || undefined,
        versions: propsValue.include_versions || undefined,
      });
  },
});
