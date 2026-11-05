import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableInsertRowsAction = createAction({
  auth: retableAuth,
  name: 'retable_insert_rows',
  classification: 'WRITE',
  displayName: 'Insert Rows',
  description: 'Inserts one or more rows into a retable in a single call',
  audience: 'ai',
  aiMetadata: { description: 'Batch-inserts rows into a Retable table, each row given as an explicit list of column_id/cell_value pairs. Use when appending one or more rows at once with known column ids (from Get Specific Table). Not idempotent — each call inserts new rows.', idempotent: false },
  props: {
    retable_id: Property.ShortText({
      displayName: 'Retable ID',
      description: 'ID of the retable, from Get Specific Table or Get Retables',
      required: true,
    }),
    rows: Property.Json({
      displayName: 'Rows',
      description: 'Array of rows to insert, e.g. [{"columns":[{"column_id":"col_1","cell_value":"Alice"}]}]',
      required: true,
    }),
  },
  async run(context) {
    const { retable_id, rows } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${retableCommon.baseUrl}/retable/${retable_id}/data`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        body: {
          data: rows,
        },
      })
    ).body;
  },
});
