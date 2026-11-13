import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateCardOutputSchema } from '../../output-schemas';

export const updateCardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_card',
  outputSchema: metabaseUpdateCardOutputSchema,
  displayName: 'Update Card',
  description: 'Update a saved question, model or metric.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a question (card): name, query, display, collection, archive state or static embedding. Archive (recoverable) is preferred over Delete Card. Embedding fields need an admin key and embedding enabled on the instance.',
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    datasetQuery: Property.Json({
      displayName: 'Dataset Query',
      description:
        'New query definition (same shape as in Create Card). Empty = unchanged.',
      required: false,
    }),
    display: Property.ShortText({
      displayName: 'Display',
      description:
        'New visualization type, e.g. table, bar, line. Empty = unchanged.',
      required: false,
    }),
    parameters: Property.Json({
      displayName: 'Parameters',
      description:
        'Replaces the filter widgets (same shape as in Create Card). Empty = unchanged.',
      required: false,
    }),
    visualizationSettings: Property.Json({
      displayName: 'Visualization Settings',
      description: 'Replaces the visualization settings. Empty = unchanged.',
      required: false,
    }),
    collectionId: metabaseAiProps.collectionId({
      required: false,
      description: 'Move to this collection. Empty = unchanged.',
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes moves the card to the trash, No restores it. Empty = unchanged.',
      required: false,
    }),
    enableEmbedding: metabaseAiProps.yesNo({
      displayName: 'Enable Embedding',
      description: 'Turn static embedding on or off. Empty = unchanged.',
      required: false,
    }),
    embeddingParams: Property.Json({
      displayName: 'Embedding Params',
      description:
        'How each filter is exposed in the embed, keyed by parameter slug: {"category": "enabled"}. Values: disabled, enabled (editable), locked. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateCard({
      auth,
      cardId: propsValue.cardId,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        dataset_query: propsValue.datasetQuery,
        display: propsValue.display,
        visualization_settings: propsValue.visualizationSettings,
        parameters: propsValue.parameters,
        collection_id: propsValue.collectionId,
        archived: propsValue.archived,
        enable_embedding: propsValue.enableEmbedding,
        embedding_params: propsValue.embeddingParams,
      },
    });
  },
});
