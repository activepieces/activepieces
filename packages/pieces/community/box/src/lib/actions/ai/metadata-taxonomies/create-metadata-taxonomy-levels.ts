import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxAppendMetadataTaxonomyLevelOutputSchema } from '../../../output-schemas';

export const createMetadataTaxonomyLevelsAction = createAction({
  auth: boxAuth,
  name: 'box_create_metadata_taxonomy_levels',
  outputSchema: boxAppendMetadataTaxonomyLevelOutputSchema,
  displayName: 'Create Metadata Taxonomy Levels',
  description: 'Creates the levels of a metadata taxonomy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates several taxonomy levels in one call, e.g. Continent, Country, City, and returns all levels. Use Append Metadata Taxonomy Level to add one level below the existing ones. Get the key from List Metadata Taxonomies or Create Metadata Taxonomy.',
    idempotent: false,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    levels: Property.Json({
      displayName: 'Levels',
      description:
        'JSON array of levels, top first. Each has displayName, and optional description and level (index from 1). E.g. [{"displayName": "Continent"}, {"displayName": "Country"}].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (!Array.isArray(propsValue.levels) || propsValue.levels.length === 0) {
      throw new Error('Levels must be a non-empty JSON array of level objects.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/levels`,
      body: propsValue.levels,
    });
  },
});
