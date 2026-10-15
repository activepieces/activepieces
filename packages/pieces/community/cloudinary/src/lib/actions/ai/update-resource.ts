import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryUpdateResourceOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateResource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_resource',
  outputSchema: cloudinaryUpdateResourceOutputSchema,
  displayName: 'Update Resource',
  description: 'Updates an asset\'s display name, folder, tags, context, structured metadata or moderation status by public ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates attributes of one asset identified by resource type, delivery type and public ID; omitted fields stay unchanged. Tags and Context replace the existing values, so use Update Resource Tags / Update Resource Context to add or remove single entries. To change the public ID itself use Rename Resource; with only an asset_id use Update Resource by Asset ID.',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    public_id: Property.ShortText({
      displayName: 'Public ID',
      description: 'The asset\'s public ID.',
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
    return makeRequest(
      auth,
      HttpMethod.POST,
      `/resources/${propsValue.resource_type}/${propsValue.type ?? 'upload'}/${aiResults.encodePath({ value: propsValue.public_id })}`,
      body,
    );
  },
});
