import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListMetadataTaxonomyNodesOutputSchema } from '../../../output-schemas';

const BOOLEANS = ['true', 'false'];

export const listMetadataTaxonomyNodesAction = createAction({
  auth: boxAuth,
  name: 'box_list_metadata_taxonomy_nodes',
  outputSchema: boxListMetadataTaxonomyNodesOutputSchema,
  displayName: 'List Metadata Taxonomy Nodes',
  description: 'Lists or searches the nodes of a metadata taxonomy.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of a taxonomy\'s nodes with their ids, optionally filtered by level, parent, ancestor or text. Sorted by name, or by relevance when Query is given. Page with Marker (next_marker). Get the key from List Metadata Taxonomies.',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    level: Property.Number({
      displayName: 'Level',
      description: 'Only nodes on this level index, starting from 1.',
      required: false,
    }),
    parent: boxAiProps.taxonomyNodeId({
      required: false,
      displayName: 'Parent ID',
      description: 'Only direct children of this node id.',
    }),
    ancestor: boxAiProps.taxonomyNodeId({
      required: false,
      displayName: 'Ancestor ID',
      description: 'Only descendants of this node id, at any depth.',
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to search node names for.',
      required: false,
    }),
    includeTotalResultCount: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Include Total Count',
      description: '"true" adds the total number of matching nodes, counted up to 10,000.',
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.includeTotalResultCount !== undefined && !BOOLEANS.includes(propsValue.includeTotalResultCount)) {
      throw new Error('Include Total Count must be "true" or "false".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/nodes`,
      query: {
        level: boxUtils.optionalString({ value: propsValue.level }),
        parent: propsValue.parent,
        ancestor: propsValue.ancestor,
        query: propsValue.query,
        'include-total-result-count': propsValue.includeTotalResultCount,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
