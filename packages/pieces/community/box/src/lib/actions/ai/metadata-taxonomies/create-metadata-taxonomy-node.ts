import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateMetadataTaxonomyNodeOutputSchema } from '../../../output-schemas';

export const createMetadataTaxonomyNodeAction = createAction({
  auth: boxAuth,
  name: 'box_create_metadata_taxonomy_node',
  outputSchema: boxCreateMetadataTaxonomyNodeOutputSchema,
  displayName: 'Create Metadata Taxonomy Node',
  description: 'Creates a node (a value) in a metadata taxonomy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a taxonomy node on a level and returns its id. Nodes below level 1 need Parent ID, a node one level up (from List Metadata Taxonomy Nodes). Get the key from List Metadata Taxonomies.',
    idempotent: false,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The node name, e.g. "France".',
      required: true,
    }),
    level: Property.Number({
      displayName: 'Level',
      description: 'Index of the level the node belongs to, starting from 1.',
      required: true,
    }),
    parentId: boxAiProps.taxonomyNodeId({
      required: false,
      displayName: 'Parent ID',
      description: 'The id of the parent node, from List Metadata Taxonomy Nodes. Leave empty for a level 1 node.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/nodes`,
      body: {
        displayName: propsValue.displayName,
        level: propsValue.level,
        ...(propsValue.parentId !== undefined ? { parentId: propsValue.parentId } : {}),
      },
    });
  },
});
