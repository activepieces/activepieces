import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxAppendMetadataTaxonomyLevelOutputSchema } from '../../../output-schemas';

export const appendMetadataTaxonomyLevelAction = createAction({
  auth: boxAuth,
  name: 'box_append_metadata_taxonomy_level',
  outputSchema: boxAppendMetadataTaxonomyLevelOutputSchema,
  displayName: 'Append Metadata Taxonomy Level',
  description: 'Adds a level below the existing levels of a metadata taxonomy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one level at the bottom of a taxonomy (the first level if it has none) and returns all levels. Use Create Metadata Taxonomy Levels to add several at once. Get the key from List Metadata Taxonomies.',
    idempotent: false,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The level name, e.g. "City".',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The level description.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/levels:append`,
      body: {
        displayName: propsValue.displayName,
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      },
    });
  },
});
