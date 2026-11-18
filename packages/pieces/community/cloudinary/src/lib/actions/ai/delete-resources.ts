import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryDeleteResourcesOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteResources = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_resources',
  outputSchema: cloudinaryDeleteResourcesOutputSchema,
  displayName: 'Delete Resources',
  description: 'Permanently deletes assets by public IDs or by public ID prefix.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes up to 100 assets of one resource type and delivery type, given either a list of public IDs or a public ID prefix (not both). Irreversible unless backups are enabled. Returns a deleted map of public_id to "deleted" or "not_found", and partial=true when more remain for a prefix (call again). To delete by tag use Delete Resources by Tag.',
    idempotent: false,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    public_ids: Property.Array({
      displayName: 'Public IDs',
      description: 'Up to 100 public IDs to delete. Use either this or Prefix.',
      required: false,
    }),
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'Delete every asset whose public ID starts with this value. Use either this or Public IDs.',
      required: false,
    }),
    keep_original: aiProps.includeFlag({ displayName: 'Keep Original', description: 'Delete only derived versions and keep the original files.' }),
    invalidate: aiProps.invalidate(),
  },
  async run({ auth, propsValue }) {
    const publicIds = aiResults.cleanArray({ values: propsValue.public_ids });
    const prefix = propsValue.prefix?.trim();
    if ((publicIds.length > 0) === Boolean(prefix)) {
      throw new Error('Provide either Public IDs or Prefix, not both.');
    }
    if (publicIds.length > 100) {
      throw new Error('Provide at most 100 public IDs per call.');
    }
    return makeRequest(auth, HttpMethod.DELETE, `/resources/${propsValue.resource_type}/${propsValue.type ?? 'upload'}`, undefined, {
      ...(publicIds.length > 0 ? { public_ids: publicIds } : { prefix }),
      keep_original: propsValue.keep_original || undefined,
      invalidate: propsValue.invalidate || undefined,
    });
  },
});
