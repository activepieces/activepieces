import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { listViewsOutputSchema } from '../output-schemas';

export const listViewsAction = createAction({
  name: 'baserow_list_views',
  classification: 'SEARCH',
  outputSchema: listViewsOutputSchema,
  displayName: 'List Views',
  description: 'Lists the views of a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all views (grid, gallery, form, kanban, calendar, timeline) of a Baserow table with their ID, name and type. Use to get a View ID for List Rows or a grid View ID for Aggregate Field. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
  },
  async run(context) {
    const { table_id } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'List Views' });
    const client = await makeClient(context.auth);
    const views = await baserowAiHelpers.execute(() => client.listAllViews({ tableId: table_id }));
    return {
      count: views.length,
      views: views.map((view) => ({ id: view['id'], name: view['name'], type: view['type'] })),
    };
  },
});
