import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListMetadataTaxonomiesOutputSchema } from '../../../output-schemas';

export const listMetadataTaxonomiesAction = createAction({
  auth: boxAuth,
  name: 'box_list_metadata_taxonomies',
  outputSchema: boxListMetadataTaxonomiesOutputSchema,
  displayName: 'List Metadata Taxonomies',
  description: 'Lists the metadata taxonomies in a namespace.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the taxonomies in a namespace, with their key, levels and id. The enterprise ID for Namespace comes from Get Current User. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}`,
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
