import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateMetadataTaxonomyLevelAction = createAction({
  auth: boxAuth,
  name: 'box_update_metadata_taxonomy_level',
  displayName: 'Update Metadata Taxonomy Level',
  description: 'Renames a level of a metadata taxonomy.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the display name and description of one taxonomy level, by its index (from Get Metadata Taxonomy). The description is left as it is when not given.',
    idempotent: true,
  },
  props: {
    namespace: boxAiProps.metadataNamespace({ required: true }),
    taxonomyKey: boxAiProps.taxonomyKey({ required: true }),
    levelIndex: Property.Number({
      displayName: 'Level Index',
      description: 'The level\'s index, starting from 1 for the top level, from Get Metadata Taxonomy.',
      required: true,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The new level name, e.g. "Country".',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new level description.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PATCH,
      path: `/metadata_taxonomies/${encodeURIComponent(propsValue.namespace)}/${encodeURIComponent(propsValue.taxonomyKey)}/levels/${encodeURIComponent(String(propsValue.levelIndex))}`,
      body: {
        displayName: propsValue.displayName,
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      },
    });
  },
});
