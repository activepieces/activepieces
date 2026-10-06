import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListResourcesByAssetIdsOutputSchema } from '../../output-schemas';

export const cloudinaryListResourcesByExternalIds = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resources_by_external_ids',
  outputSchema: cloudinaryListResourcesByAssetIdsOutputSchema,
  displayName: 'List Resources by External IDs',
  description: 'Fetches assets by the external IDs assigned to them.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Fetches up to 100 assets by external ID, the caller-assigned identifier set on an asset (for example by a DAM or PIM sync). Use when the caller only knows its own IDs, not Cloudinary public IDs or asset IDs.',
    idempotent: true,
  },
  props: {
    external_ids: Property.Array({
      displayName: 'External IDs',
      description: 'Up to 100 external IDs.',
      required: true,
    }),
    resource_type: aiProps.resourceType({ required: false }),
    include_tags: aiProps.includeFlag({ displayName: 'Include Tags', description: 'Include each asset\'s tags.' }),
    include_context: aiProps.includeFlag({ displayName: 'Include Context', description: 'Include each asset\'s contextual metadata.' }),
    include_metadata: aiProps.includeFlag({ displayName: 'Include Structured Metadata', description: 'Include each asset\'s structured metadata values.' }),
  },
  async run({ auth, propsValue }) {
    const externalIds = aiResults.cleanArray({ values: propsValue.external_ids });
    if (externalIds.length === 0 || externalIds.length > 100) {
      throw new Error('Provide between 1 and 100 external IDs.');
    }
    const response: ResourceList = await makeRequest(auth, HttpMethod.GET, '/resources/by_external_ids', undefined, {
        external_ids: externalIds,
        resource_type: propsValue.resource_type,
        tags: propsValue.include_tags || undefined,
        context: propsValue.include_context || undefined,
        metadata: propsValue.include_metadata || undefined,
      });
    return aiResults.toResourceList({ response });
  },
});
