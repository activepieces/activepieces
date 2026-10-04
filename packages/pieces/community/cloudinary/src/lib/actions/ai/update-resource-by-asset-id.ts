import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryUpdateResourceOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateResourceByAssetId = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_resource_by_asset_id',
  outputSchema: cloudinaryUpdateResourceOutputSchema,
  displayName: 'Update Resource by Asset ID',
  description: 'Updates an asset\'s display name, folder, tags, context, structured metadata or moderation status by asset ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Same as Update Resource but targets the asset by its immutable asset_id; omitted fields stay unchanged. Tags and Context replace the existing values.',
    idempotent: true,
  },
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset\'s immutable asset_id.',
      required: true,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'New display name.',
      required: false,
    }),
    asset_folder: Property.ShortText({
      displayName: 'Asset Folder',
      description: 'Move the asset to this folder (dynamic folder mode).',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Replaces ALL existing tags with this list. To add or remove single tags use Update Resource Tags.',
      required: false,
    }),
    context: Property.ShortText({
      displayName: 'Context',
      description: 'Replaces contextual metadata, as pipe-separated key=value pairs (e.g. "alt=Red shoe|caption=Summer").',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Structured Metadata',
      description: 'Structured metadata values keyed by field external_id. Only the given fields change.',
      required: false,
    }),
    moderation_status: Property.StaticDropdown({
      displayName: 'Moderation Status',
      description: 'Approve or reject an asset in manual moderation.',
      required: false,
      options: {
        options: [
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const tags = propsValue.tags === undefined ? undefined : aiResults.cleanArray({ values: propsValue.tags });
    const body = {
      ...(propsValue.display_name !== undefined ? { display_name: propsValue.display_name } : {}),
      ...(propsValue.asset_folder !== undefined ? { asset_folder: propsValue.asset_folder.trim() } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(propsValue.context !== undefined ? { context: propsValue.context } : {}),
      ...(propsValue.metadata !== undefined && Object.keys(propsValue.metadata).length > 0 ? { metadata: propsValue.metadata } : {}),
      ...(propsValue.moderation_status !== undefined ? { moderation_status: propsValue.moderation_status } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    return makeRequest(auth, HttpMethod.PUT, `/resources/${encodeURIComponent(propsValue.asset_id.trim())}`, body);
  },
});
