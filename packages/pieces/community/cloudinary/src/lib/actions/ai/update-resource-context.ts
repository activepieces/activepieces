import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryUpdateResourceContextOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateResourceContext = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_resource_context',
  outputSchema: cloudinaryUpdateResourceContextOutputSchema,
  displayName: 'Update Resource Context',
  description: 'Adds contextual metadata to, or clears it from, multiple assets.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds or updates contextual metadata keys (free-form key=value pairs such as alt or caption) on up to 1000 assets, or removes all context from them. Existing keys not mentioned stay. For typed structured metadata fields use Update Resource Metadata.',
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
      description: 'Add/update keys, or remove all context.',
      required: true,
      defaultValue: 'add',
      options: {
        options: [
          { label: 'Add or update keys', value: 'add' },
          { label: 'Remove all context', value: 'remove_all' },
        ],
      },
    }),
    context: Property.ShortText({
      displayName: 'Context',
      description: 'Pipe-separated key=value pairs (e.g. "alt=Red shoe|caption=Summer"). Required for Add.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const publicIds = aiResults.requireItems({ values: propsValue.public_ids, label: 'public IDs', max: 1000 });
    if (propsValue.command === 'add' && !propsValue.context) {
      throw new Error('Provide the context to add.');
    }
    return makeRequest(auth, HttpMethod.POST, `/${propsValue.resource_type}/context`, {
      public_ids: publicIds,
      type: propsValue.type ?? 'upload',
      command: propsValue.command,
      ...(propsValue.command === 'add' ? { context: propsValue.context } : {}),
    });
  },
});
