import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateMetadataTaxonomyAction = createAction({
  auth: boxAuth,
  name: 'box_update_metadata_taxonomy',
  displayName: 'Update Metadata Taxonomy',
  description: 'Renames a metadata taxonomy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a taxonomy\'s display name; its key stays the same. Use Update Metadata Taxonomy Level or Update Metadata Taxonomy Node for levels and nodes. Get the key from List Metadata Taxonomies.',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The new taxonomy name shown in Box.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PATCH,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}`,
      body: { displayName: propsValue.displayName },
    });
  },
});
