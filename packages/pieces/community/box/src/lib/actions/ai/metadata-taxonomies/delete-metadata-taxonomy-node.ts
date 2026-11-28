import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteMetadataTaxonomyNodeOutputSchema } from '../../../output-schemas';

export const deleteMetadataTaxonomyNodeAction = createAction({
  auth: boxAuth,
  name: 'box_delete_metadata_taxonomy_node',
  outputSchema: boxDeleteMetadataTaxonomyNodeOutputSchema,
  displayName: 'Delete Metadata Taxonomy Node',
  description: 'Deletes a node of a metadata taxonomy.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a taxonomy node; it can\'t be undone, and only nodes with no children can be deleted. Get the node ID from List Metadata Taxonomy Nodes.',
    idempotent: false,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    nodeId: boxAiProps.taxonomyNodeId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/nodes/${encodeURIComponent(propsValue.nodeId)}`,
    });
    return {
      deleted: true,
      namespace: propsValue.namespace,
      taxonomyKey: propsValue.taxonomyKey,
      nodeId: propsValue.nodeId,
    };
  },
});
