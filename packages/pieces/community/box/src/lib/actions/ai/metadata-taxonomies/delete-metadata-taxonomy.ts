import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteMetadataTaxonomyOutputSchema } from '../../../output-schemas';

export const deleteMetadataTaxonomyAction = createAction({
  auth: boxAuth,
  name: 'box_delete_metadata_taxonomy',
  outputSchema: boxDeleteMetadataTaxonomyOutputSchema,
  displayName: 'Delete Metadata Taxonomy',
  description: 'Deletes a metadata taxonomy.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a taxonomy with its levels and nodes; it can\'t be undone. Get the key from List Metadata Taxonomies.',
    idempotent: false,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}`,
    });
    return { deleted: true, namespace: propsValue.namespace, taxonomyKey: propsValue.taxonomyKey };
  },
});
