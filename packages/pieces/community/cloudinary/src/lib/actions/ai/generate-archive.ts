import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryGenerateArchiveOutputSchema } from '../../output-schemas';

export const cloudinaryGenerateArchive = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_generate_archive',
  outputSchema: cloudinaryGenerateArchiveOutputSchema,
  displayName: 'Generate Archive',
  description: 'Creates a ZIP or TGZ archive of assets and stores it as a raw asset.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Bundles assets selected by public IDs, tags and/or public ID prefixes into a ZIP or TGZ file, stored in Cloudinary as a new raw asset; returns its secure_url, resource_count and any missing IDs. Use to hand off many files as one download. Not idempotent: each call creates a new archive asset unless Target Public ID is reused.',
    idempotent: false,
  },
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Which asset type to include. Defaults to image.',
      required: false,
      defaultValue: 'image',
      options: {
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Raw', value: 'raw' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    type: aiProps.deliveryType(),
    public_ids: Property.Array({ displayName: 'Public IDs', description: 'Assets to include.', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Include all assets with any of these tags.', required: false }),
    prefixes: Property.Array({ displayName: 'Prefixes', description: 'Include all assets whose public ID starts with any of these.', required: false }),
    target_format: Property.StaticDropdown({
      displayName: 'Archive Format',
      description: 'Defaults to zip.',
      required: false,
      options: { options: [{ label: 'ZIP', value: 'zip' }, { label: 'TGZ', value: 'tgz' }] },
    }),
    target_public_id: Property.ShortText({ displayName: 'Target Public ID', description: 'Public ID for the archive file.', required: false }),
    flatten_folders: aiProps.includeFlag({ displayName: 'Flatten Folders', description: 'Put all files at the archive root.' }),
    allow_missing: aiProps.includeFlag({ displayName: 'Allow Missing', description: 'Create the archive even if some requested assets do not exist.' }),
  },
  async run({ auth, propsValue }) {
    const publicIds = aiResults.cleanArray({ values: propsValue.public_ids });
    const tags = aiResults.cleanArray({ values: propsValue.tags });
    const prefixes = aiResults.cleanArray({ values: propsValue.prefixes });
    if (publicIds.length + tags.length + prefixes.length === 0) {
      throw new Error('Provide at least one of Public IDs, Tags or Prefixes.');
    }
    const body = {
      mode: 'create',
      type: propsValue.type ?? 'upload',
      ...(publicIds.length > 0 ? { public_ids: publicIds } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(prefixes.length > 0 ? { prefixes } : {}),
      ...(propsValue.target_format ? { target_format: propsValue.target_format } : {}),
      ...(propsValue.target_public_id ? { target_public_id: propsValue.target_public_id.trim() } : {}),
      ...(propsValue.flatten_folders ? { flatten_folders: true } : {}),
      ...(propsValue.allow_missing ? { allow_missing: true } : {}),
    };
    return makeRequest(auth, HttpMethod.POST, `/${propsValue.resource_type ?? 'image'}/generate_archive`, body);
  },
});
