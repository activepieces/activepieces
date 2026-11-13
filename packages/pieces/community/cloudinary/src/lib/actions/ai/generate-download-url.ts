import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { buildSignedUrl } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { cloudinaryGenerateDownloadUrlOutputSchema } from '../../output-schemas';

export const cloudinaryGenerateDownloadUrl = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_generate_download_url',
  outputSchema: cloudinaryGenerateDownloadUrlOutputSchema,
  displayName: 'Generate Download URL',
  description: 'Creates a signed, expiring URL that downloads an asset, including private and authenticated ones.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Builds a signed URL that downloads the original file of an asset, which works for private and authenticated assets that have no public delivery URL. Identify the asset by Public ID (with resource type, delivery type and file format) or by Asset ID, not both. The URL is signed locally and expires after the given number of seconds (default 1 hour); nothing is changed in Cloudinary. For a transformed public delivery URL use Transform Resource.',
    idempotent: true,
  },
  props: {
    public_id: Property.ShortText({
      displayName: 'Public ID',
      description: 'The asset\'s public ID. Use either this or Asset ID.',
      required: false,
    }),
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset\'s immutable asset_id. Use either this or Public ID.',
      required: false,
    }),
    resource_type: aiProps.resourceType({ required: false }),
    type: aiProps.deliveryType(),
    format: Property.ShortText({
      displayName: 'Format',
      description: 'File format/extension of the download (e.g. "jpg", "pdf"). Required with Public ID for images and videos.',
      required: false,
    }),
    expires_in_seconds: Property.Number({
      displayName: 'Expires In (Seconds)',
      description: 'How long the URL stays valid. Defaults to 3600.',
      required: false,
    }),
    attachment: aiProps.includeFlag({ displayName: 'Force Download', description: 'Make browsers save the file instead of displaying it.' }),
    target_filename: Property.ShortText({
      displayName: 'Target Filename',
      description: 'File name to suggest when the file is saved.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const publicId = propsValue.public_id?.trim();
    const assetId = propsValue.asset_id?.trim();
    if (Boolean(publicId) === Boolean(assetId)) {
      throw new Error('Provide exactly one of Public ID or Asset ID.');
    }
    const expiresAt = Math.floor(Date.now() / 1000) + (propsValue.expires_in_seconds ?? 3600);
    const shared = {
      format: propsValue.format?.trim(),
      expires_at: expiresAt,
      attachment: propsValue.attachment ? true : undefined,
      target_filename: propsValue.target_filename?.trim(),
    };
    const downloadUrl = publicId
      ? buildSignedUrl({
          auth,
          path: `/${propsValue.resource_type ?? 'image'}/download`,
          params: { ...shared, public_id: publicId, type: propsValue.type ?? 'upload' },
        })
      : buildSignedUrl({
          auth,
          path: '/asset/download',
          params: { ...shared, asset_id: assetId },
        });
    return {
      download_url: downloadUrl,
      expires_at: new Date(expiresAt * 1000).toISOString(),
      public_id: publicId ?? null,
      asset_id: assetId ?? null,
    };
  },
});
