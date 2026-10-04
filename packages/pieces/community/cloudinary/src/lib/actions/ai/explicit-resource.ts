import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryExplicitResourceOutputSchema } from '../../output-schemas';

export const cloudinaryExplicitResource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_explicit_resource',
  outputSchema: cloudinaryExplicitResourceOutputSchema,
  displayName: 'Apply Operations to Resource',
  description: 'Runs upload-time operations (eager transformations, tags, context, metadata) on an existing asset.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies upload-style operations to an existing asset without re-uploading it, most often to pre-generate derived versions with eager transformations (e.g. "c_fill,w_400,h_400|f_webp,q_auto"). Can also set tags, context or structured metadata. Use eager async for videos. Returns the asset with an eager array of the generated URLs.',
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
    eager: Property.ShortText({
      displayName: 'Eager Transformations',
      description: 'Transformations to generate now, pipe-separated (e.g. "c_fill,w_400,h_400|f_webp,q_auto").',
      required: false,
    }),
    eager_async: aiProps.includeFlag({ displayName: 'Generate Asynchronously', description: 'Generate eager transformations in the background (recommended for videos).' }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Replaces the asset\'s tags with this list.',
      required: false,
    }),
    context: Property.ShortText({
      displayName: 'Context',
      description: 'Contextual metadata as pipe-separated key=value pairs.',
      required: false,
    }),
    invalidate: aiProps.invalidate(),
  },
  async run({ auth, propsValue }) {
    const tags = aiResults.cleanArray({ values: propsValue.tags });
    const body = {
      public_id: propsValue.public_id.trim(),
      type: propsValue.type ?? 'upload',
      ...(propsValue.eager ? { eager: propsValue.eager.trim() } : {}),
      ...(propsValue.eager_async ? { eager_async: true } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(propsValue.context ? { context: propsValue.context } : {}),
      ...(propsValue.invalidate ? { invalidate: true } : {}),
    };
    return makeRequest(auth, HttpMethod.POST, `/${propsValue.resource_type}/explicit`, body);
  },
});
