import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getMetadataTaxonomyAction = createAction({
  auth: boxAuth,
  name: 'box_get_metadata_taxonomy',
  displayName: 'Get Metadata Taxonomy',
  description: 'Gets a metadata taxonomy by key.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one taxonomy with its id, display name and levels. Get the key from List Metadata Taxonomies; use List Metadata Taxonomy Nodes for its nodes.',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}`,
    });
  },
});
