import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryUpdateResourceContextOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateResourceTags = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_resource_tags',
  outputSchema: cloudinaryUpdateResourceContextOutputSchema,
  displayName: 'Update Resource Tags',
  description: 'Adds, removes or replaces tags on up to 1000 assets at once.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes tags on many assets of one resource type in one call: add tags, remove tags, replace all tags with the given ones, or remove all tags. Public IDs times tags must not exceed 1000. Returns the public_ids that were updated.',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    public_ids: Property.Array({
      displayName: 'Public IDs',
      description: 'Public IDs of the assets to update (up to 1000).',
      required: true,
    }),
    command: Property.StaticDropdown({
      displayName: 'Command',
      description: 'What to do with the tags.',
      required: true,
      defaultValue: 'add',
      options: {
        options: [
          { label: 'Add tags', value: 'add' },
          { label: 'Remove tags', value: 'remove' },
          { label: 'Replace all tags', value: 'replace' },
          { label: 'Remove all tags', value: 'remove_all' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add, remove or set. Not used with Remove all tags.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const publicIds = aiResults.requireItems({ values: propsValue.public_ids, label: 'public IDs', max: 1000 });
    const tags = aiResults.cleanArray({ values: propsValue.tags });
    if (propsValue.command !== 'remove_all' && tags.length === 0) {
      throw new Error('Provide at least one tag for this command.');
    }
    return makeRequest(auth, HttpMethod.POST, `/${propsValue.resource_type}/tags`, {
      public_ids: publicIds,
      type: propsValue.type ?? 'upload',
      command: propsValue.command,
      ...(propsValue.command !== 'remove_all' ? { tags } : {}),
    });
  },
});
