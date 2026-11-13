import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryDeleteResourcesByTagOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteResourcesByTag = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_resources_by_tag',
  outputSchema: cloudinaryDeleteResourcesByTagOutputSchema,
  displayName: 'Delete Resources by Tag',
  description: 'Permanently deletes all assets of one resource type that carry a tag.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes every asset of one resource type carrying the given tag, up to 1000 per call; partial=true in the result means more remain, so call again. Irreversible unless backups are enabled. Check what matches first with List Resources by Tag.',
    idempotent: false,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'The exact tag whose assets will be deleted.',
      required: true,
    }),
    keep_original: aiProps.includeFlag({ displayName: 'Keep Original', description: 'Delete only derived versions and keep the original files.' }),
    invalidate: aiProps.invalidate(),
  },
  async run({ auth, propsValue }) {
    return makeRequest(
      auth,
      HttpMethod.DELETE,
      `/resources/${propsValue.resource_type}/tags/${encodeURIComponent(propsValue.tag.trim())}`,
      undefined,
      {
        keep_original: propsValue.keep_original || undefined,
        invalidate: propsValue.invalidate || undefined,
      },
    );
  },
});
