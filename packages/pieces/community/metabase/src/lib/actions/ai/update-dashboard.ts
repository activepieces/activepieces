import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateDashboardOutputSchema } from '../../output-schemas';

export const updateDashboardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_dashboard',
  outputSchema: metabaseUpdateDashboardOutputSchema,
  displayName: 'Update Dashboard',
  description: 'Update a dashboard, including its cards and tabs.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a dashboard. Dashcards and Tabs each replace the whole list: cards or tabs you leave out are removed, so start from Get Dashboard; new dashcards need a negative id. Archive (recoverable) is preferred over Delete Dashboard; embedding fields need an admin key and embedding enabled.',
    idempotent: true,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
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
    collectionId: metabaseAiProps.collectionId({
      required: false,
      description: 'Move to this collection. Empty = unchanged.',
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes moves the dashboard to the trash, No restores it. Empty = unchanged.',
      required: false,
    }),
    dashcards: Property.Json({
      displayName: 'Dashcards',
      description:
        'Replaces ALL cards on the dashboard: [{"id": -1, "card_id": 12, "row": 0, "col": 0, "size_x": 12, "size_y": 6}]. Keep existing ones (with their ids) from Get Dashboard; new ones use negative ids. Empty = unchanged.',
      required: false,
    }),
    tabs: Property.Json({
      displayName: 'Tabs',
      description:
        'Replaces ALL tabs: [{"id": -1, "name": "Overview"}]. Keep existing ones from Get Dashboard. Empty = unchanged.',
      required: false,
    }),
    parameters: Property.Json({
      displayName: 'Parameters',
      description: 'Replaces the dashboard filters (array). Empty = unchanged.',
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
        'How each filter is exposed in the embed, keyed by parameter slug: {"category": "enabled"}. Values: disabled, enabled, locked. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateDashboard({
      auth,
      dashboardId: propsValue.dashboardId,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        collection_id: propsValue.collectionId,
        archived: propsValue.archived,
        dashcards: propsValue.dashcards,
        tabs: propsValue.tabs,
        parameters: propsValue.parameters,
        enable_embedding: propsValue.enableEmbedding,
        embedding_params: propsValue.embeddingParams,
      },
    });
  },
});
