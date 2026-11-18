import { createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const listViewsAction = createAction({
  auth: TeableAuth,
  name: 'teable_list_views',
  classification: 'READ',
  displayName: 'List Views',
  description: 'Lists all views of a table.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns every view of a Teable table, with its ID, name, and type (grid, kanban, calendar, form, gallery). Use a view ID to scope List Records. Read-only.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
  },
  outputSchema: teableOutputSchemas.listViews,
  async run(context) {
    return teableClient.listViews({ auth: context.auth, tableId: context.propsValue.table_id });
  },
});
