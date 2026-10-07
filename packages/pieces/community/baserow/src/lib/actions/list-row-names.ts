import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { listRowNamesOutputSchema } from '../output-schemas';

export const listRowNamesAction = createAction({
  name: 'baserow_list_row_names',
  classification: 'READ',
  outputSchema: listRowNamesOutputSchema,
  displayName: 'List Row Names',
  description: 'Gets the primary field value of the given rows.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the display name (primary field value) of each given row ID in a Baserow table. Use to turn linked-row IDs into readable names without fetching whole rows. Works with Database Token and Email & Password connections. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    row_ids: Property.Array({
      displayName: 'Row IDs',
      description: 'Numeric row IDs to look up.',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, row_ids } = context.propsValue;
    const ids = baserowAiHelpers.toIdArray({ value: row_ids, propName: 'Row IDs', max: 200 });
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() =>
      client.listRowNames({ tableId: table_id, rowIds: ids })
    );
    const names = response[String(table_id)] ?? {};
    return {
      rows: Object.entries(names).map(([id, name]) => ({ id: Number(id), name })),
    };
  },
});
