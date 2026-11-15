import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryDeleteDerivedResourcesOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteDerivedResources = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_derived_resources',
  outputSchema: cloudinaryDeleteDerivedResourcesOutputSchema,
  displayName: 'Delete Derived Resources',
  description: 'Deletes generated (derived) versions of assets by their derived resource IDs.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes up to 100 derived versions (transformed copies) by derived resource ID, keeping the originals. The IDs are the "id" values in the derived array returned by Get Resource. Cloudinary regenerates a derived version on its next request.',
    idempotent: false,
  },
  props: {
    derived_resource_ids: Property.Array({
      displayName: 'Derived Resource IDs',
      description: 'Up to 100 derived resource IDs, from the derived array of Get Resource.',
      required: true,
    }),
    invalidate: aiProps.invalidate(),
  },
  async run({ auth, propsValue }) {
    const ids = aiResults.requireItems({ values: propsValue.derived_resource_ids, label: 'derived resource IDs', max: 100 });
    return makeRequest(auth, HttpMethod.DELETE, '/derived_resources', undefined, {
      derived_resource_ids: ids,
      invalidate: propsValue.invalidate || undefined,
    });
  },
});
