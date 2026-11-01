import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateActionOutputSchema } from '../../output-schemas';

export const createActionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_action',
  outputSchema: metabaseCreateActionOutputSchema,
  displayName: 'Create Action',
  description: 'Create a Metabase action on a model.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Creates a Metabase action on a model: a SQL write query, or a basic create/update/delete row action. Needs actions enabled on the model's database. Each call creates a new action.",
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    modelId: metabaseAiProps.cardId({
      required: true,
      displayName: 'Model ID',
      description:
        'The model (a card of type model) the action belongs to, from List Cards.',
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'SQL query, or a basic row action generated from the model.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'SQL query', value: 'query' },
          { label: 'Basic row action', value: 'implicit' },
        ],
      },
    }),
    databaseId: metabaseAiProps.databaseId({
      required: false,
      description:
        'For SQL actions: the database to run against, from List Databases.',
    }),
    datasetQuery: Property.Json({
      displayName: 'Dataset Query',
      description:
        'For SQL actions: {"database": 1, "type": "native", "native": {"query": "UPDATE orders SET status = {{status}} WHERE id = {{id}}", "template-tags": {}}}.',
      required: false,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Row Action',
      description: 'For basic row actions: which operation.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Create row', value: 'row/create' },
          { label: 'Update row', value: 'row/update' },
          { label: 'Delete row', value: 'row/delete' },
        ],
      },
    }),
    parameters: Property.Json({
      displayName: 'Parameters',
      description:
        'For SQL actions: the parameter list, e.g. [{"id": "status", "type": "string/=", "target": ["variable", ["template-tag", "status"]]}].',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createAction({
      auth,
      body: {
        name: propsValue.name,
        model_id: propsValue.modelId,
        type: propsValue.type,
        database_id: propsValue.databaseId,
        dataset_query: propsValue.datasetQuery,
        kind: propsValue.kind,
        parameters: propsValue.parameters,
        description: propsValue.description,
      },
    });
  },
});
