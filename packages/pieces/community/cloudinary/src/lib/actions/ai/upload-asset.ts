import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryUploadAssetOutputSchema } from '../../output-schemas';

export const cloudinaryUploadAsset = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_upload_asset',
  outputSchema: cloudinaryUploadAssetOutputSchema,
  displayName: 'Upload Asset',
  description: 'Uploads a file to Cloudinary from a public URL or a data URI.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads one file from a remote URL (http/https/s3/gs) or a base64 data URI, with resource type auto-detected by default. Optionally sets the public ID, asset folder, tags, contextual metadata, display name or an upload preset. Returns the new asset_id, public_id and delivery URLs. Not idempotent: each call creates a new asset unless a fixed Public ID is given with Overwrite.',
    idempotent: false,
  },
  props: {
    file: Property.LongText({
      displayName: 'File URL or Data URI',
      description: 'A publicly reachable URL of the file, or a data URI (data:image/png;base64,...).',
      required: true,
    }),
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Asset type. Defaults to auto-detect.',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto-detect', value: 'auto' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Raw', value: 'raw' },
        ],
      },
    }),
    public_id: Property.ShortText({
      displayName: 'Public ID',
      description: 'Public ID to assign (without extension). Leave empty for a random ID.',
      required: false,
    }),
    asset_folder: Property.ShortText({
      displayName: 'Asset Folder',
      description: 'Folder to place the asset in (e.g. "marketing/banners").',
      required: false,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'Human-readable name shown in the Media Library.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add to the asset.',
      required: false,
    }),
    context: Property.ShortText({
      displayName: 'Context',
      description: 'Contextual metadata as pipe-separated key=value pairs (e.g. "alt=Red shoe|caption=Summer").',
      required: false,
    }),
    upload_preset: Property.ShortText({
      displayName: 'Upload Preset',
      description: 'Name of an upload preset to apply. List Upload Presets returns the names.',
      required: false,
    }),
    overwrite: aiProps.optionalBoolean({ displayName: 'Overwrite', description: 'Replace an existing asset with the same Public ID.' }),
    use_filename: aiProps.includeFlag({ displayName: 'Use Original Filename', description: 'Use the source file name as the public ID (when Public ID is empty).' }),
  },
  async run({ auth, propsValue }) {
    const tags = aiResults.cleanArray({ values: propsValue.tags });
    const overwrite = aiResults.toBoolean({ value: propsValue.overwrite });
    const body = {
      file: propsValue.file.trim(),
      ...(propsValue.public_id ? { public_id: propsValue.public_id.trim() } : {}),
      ...(propsValue.asset_folder ? { asset_folder: propsValue.asset_folder.trim() } : {}),
      ...(propsValue.display_name ? { display_name: propsValue.display_name } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(propsValue.context ? { context: propsValue.context } : {}),
      ...(propsValue.upload_preset ? { upload_preset: propsValue.upload_preset.trim() } : {}),
      ...(overwrite !== undefined ? { overwrite } : {}),
      ...(propsValue.use_filename ? { use_filename: true } : {}),
    };
    return makeRequest(auth, HttpMethod.POST, `/${propsValue.resource_type ?? 'auto'}/upload`, body);
  },
});
