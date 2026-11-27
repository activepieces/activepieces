import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteLastMetadataTaxonomyLevelAction = createAction({
  auth: boxAuth,
  name: 'box_delete_last_metadata_taxonomy_level',
  displayName: 'Delete Last Metadata Taxonomy Level',
  description: 'Deletes the bottom level of a metadata taxonomy.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes the last (lowest) level of a taxonomy and returns the remaining levels; each call removes one more level. Get the key from List Metadata Taxonomies.',
    idempotent: false,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/levels:trim`,
    });
  },
});
