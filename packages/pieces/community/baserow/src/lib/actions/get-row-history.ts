import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { getRowHistoryOutputSchema } from '../output-schemas';

export const getRowHistoryAction = createAction({
  name: 'baserow_get_row_history',
  classification: 'READ',
  outputSchema: getRowHistoryOutputSchema,
  displayName: 'Get Row History',
  description: 'Lists the change history of a row.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the change log of a Baserow row, newest first: who changed which fields, when, and the before/after values. Use to audit edits or recover a previous value. History is kept for a limited period (180 days by default). Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    row_id: baserowAiProps.rowIdProp(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum entries to return.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of entries to skip, for paging.',
      required: false,
    }),
  },
  async run(context) {
    const { table_id, row_id, limit, offset } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Get Row History' });
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() =>
      client.getRowHistory({
        tableId: table_id,
        rowId: row_id,
        limit: limit ?? undefined,
        offset: offset ?? undefined,
      })
    );
    return { count: response['count'], has_more: Boolean(response['next']), entries: response['results'] };
  },
});
