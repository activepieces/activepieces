import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableUpdateRowsAction = createAction({
  auth: retableAuth,
  name: 'retable_update_rows',
  classification: 'WRITE',
  displayName: 'Update Rows',
  description: 'Updates one or more rows in a retable in a single call',
  audience: 'ai',
  aiMetadata: { description: 'Batch-updates rows in a Retable table, each row given by row_id and the list of column_id/update_cell_value pairs to change. Only the supplied columns are changed. Not idempotent as a batch op, but re-applying the same values is a no-op.', idempotent: false },
  props: {
    retable_id: retableCommon.retable_id(),
    rows: Property.Json({
      displayName: 'Rows',
      description: 'Array of row updates, e.g. [{"row_id":123,"columns":[{"column_id":"col_1","update_cell_value":"Bob"}]}]',
      required: true,
    }),
  },
  async run(context) {
    const { retable_id, rows } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${retableCommon.baseUrl}/retable/${retable_id}/data`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        body: {
          rows,
        },
      })
    ).body;
  },
});
