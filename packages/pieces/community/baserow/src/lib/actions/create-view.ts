import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { createViewOutputSchema } from '../output-schemas';

export const createViewAction = createAction({
  name: 'baserow_create_view',
  classification: 'WRITE',
  outputSchema: createViewOutputSchema,
  displayName: 'Create View',
  description: 'Creates a grid, gallery or form view on a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new grid, gallery or form view on a Baserow table and returns its ID. Use when a separate saved view is needed, for example a grid view to aggregate over. Requires an Email & Password connection. Not idempotent — each call creates another view.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new view.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'The kind of view to create.',
      required: true,
      defaultValue: 'grid',
      options: {
        disabled: false,
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'Gallery', value: 'gallery' },
          { label: 'Form', value: 'form' },
        ],
      },
    }),
  },
  async run(context) {
    const { table_id, name, type } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Create View' });
    const client = await makeClient(context.auth);
    const view = await baserowAiHelpers.execute(() =>
      client.createView({ tableId: table_id, name, type })
    );
    return { id: view['id'], name: view['name'], type: view['type'], table_id };
  },
});
