import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateCardOutputSchema } from '../../output-schemas';

export const createCardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_card',
  outputSchema: metabaseCreateCardOutputSchema,
  displayName: 'Create Card',
  description: 'Create a saved question, model or metric.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Saves a new question (card), model or metric from a query definition. For SQL pass a native query; get database IDs from List Databases. Each call creates a new card.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    datasetQuery: Property.Json({
      displayName: 'Dataset Query',
      description:
        'The query. SQL example: {"database": 1, "type": "native", "native": {"query": "SELECT * FROM orders LIMIT 10"}}. MBQL example: {"database": 1, "type": "query", "query": {"source-table": 2}}.',
      required: true,
    }),
    display: Property.ShortText({
      displayName: 'Display',
      description:
        'Visualization type, e.g. table, bar, line, pie, scalar. Empty = table.',
      required: false,
    }),
    parameters: Property.Json({
      displayName: 'Parameters',
      description:
        'Filter widgets for the SQL template tags, as a list. Needed before Run Card Query can filter by slug. Example for a {{category}} field-filter tag: [{"id": "<tag id>", "slug": "category", "name": "Category", "type": "string/=", "target": ["dimension", ["template-tag", "category"]]}]. Empty = none.',
      required: false,
    }),
    visualizationSettings: Property.Json({
      displayName: 'Visualization Settings',
      description: 'Visualization settings object. Empty = defaults.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    collectionId: metabaseAiProps.collectionId({ required: false }),
    dashboardId: metabaseAiProps.dashboardId({
      required: false,
      description:
        'Save the question inside this dashboard instead of a collection. Get it from List Dashboards.',
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Question, model or metric. Empty = question.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Question', value: 'question' },
          { label: 'Model', value: 'model' },
          { label: 'Metric', value: 'metric' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createCard({
      auth,
      body: {
        name: propsValue.name,
        dataset_query: propsValue.datasetQuery,
        display: propsValue.display ?? 'table',
        visualization_settings: propsValue.visualizationSettings ?? {},
        parameters: propsValue.parameters,
        description: propsValue.description,
        collection_id: propsValue.collectionId,
        dashboard_id: propsValue.dashboardId,
        type: propsValue.type,
      },
    });
  },
});
