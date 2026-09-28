import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableDeleteColumnsAction = createAction({
  auth: retableAuth,
  name: 'retable_delete_columns',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Columns',
  description: 'Deletes one or more columns from a retable, including their cell data',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes columns from a Retable table by column id, which also deletes every cell value stored in those columns. Not idempotent — re-running with the same ids deletes nothing further.', idempotent: false },
  props: {
    retable_id: retableCommon.retable_id(),
    column_ids: Property.Array({
      displayName: 'Column IDs',
      required: true,
    }),
  },
  async run(context) {
    const { retable_id, column_ids } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${retableCommon.baseUrl}/retable/${retable_id}/column`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        body: {
          column_ids,
        },
      })
    ).body;
  },
});
