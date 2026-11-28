import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateMetadataTaxonomyNodeOutputSchema } from '../../../output-schemas';

export const updateMetadataTaxonomyNodeAction = createAction({
  auth: boxAuth,
  name: 'box_update_metadata_taxonomy_node',
  outputSchema: boxCreateMetadataTaxonomyNodeOutputSchema,
  displayName: 'Update Metadata Taxonomy Node',
  description: 'Renames a node of a metadata taxonomy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a taxonomy node\'s display name; its id, level and parent stay the same. Get the node ID from List Metadata Taxonomy Nodes.',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    nodeId: boxAiProps.taxonomyNodeId({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The new node name.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PATCH,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/nodes/${encodeURIComponent(propsValue.nodeId)}`,
      body: { displayName: propsValue.displayName },
    });
  },
});
