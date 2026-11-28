import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateMetadataTaxonomyNodeOutputSchema } from '../../../output-schemas';

export const getMetadataTaxonomyNodeAction = createAction({
  auth: boxAuth,
  name: 'box_get_metadata_taxonomy_node',
  outputSchema: boxCreateMetadataTaxonomyNodeOutputSchema,
  displayName: 'Get Metadata Taxonomy Node',
  description: 'Gets a node of a metadata taxonomy.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one taxonomy node with its level, parent and ancestors. Get the node ID from List Metadata Taxonomy Nodes or Create Metadata Taxonomy Node.',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    nodeId: boxAiProps.taxonomyNodeId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/nodes/${encodeURIComponent(propsValue.nodeId)}`,
    });
  },
});
