import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateActionOutputSchema } from '../../output-schemas';

export const updateActionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_action',
  outputSchema: metabaseUpdateActionOutputSchema,
  displayName: 'Update Action',
  description: 'Change or archive a Metabase action.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a Metabase action. Archived = Yes hides it (recoverable).',
    idempotent: true,
  },
  props: {
    actionId: metabaseAiProps.actionId({ required: true }),
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
        'New SQL query definition (SQL actions only). Empty = unchanged.',
      required: false,
    }),
    parameters: Property.Json({
      displayName: 'Parameters',
      description: 'Replaces the parameter list. Empty = unchanged.',
      required: false,
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes archives the action, No restores it. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateAction({
      auth,
      actionId: propsValue.actionId,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        dataset_query: propsValue.datasetQuery,
        parameters: propsValue.parameters,
        archived: propsValue.archived,
      },
    });
  },
});
