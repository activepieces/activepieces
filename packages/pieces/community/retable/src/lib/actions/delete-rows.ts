import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableDeleteRowsAction = createAction({
  auth: retableAuth,
  name: 'retable_delete_rows',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Rows',
  description: 'Deletes one or more rows from a retable by row id',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes rows from a Retable table by row id. Row ids that no longer exist are ignored and are not counted as deleted. Not idempotent — re-running with the same ids deletes nothing further and returns a lower count.', idempotent: false },
  props: {
    retable_id: Property.ShortText({
      displayName: 'Retable ID',
      description: 'ID of the retable, from Get Specific Table or Get Retables',
      required: true,
    }),
    row_ids: Property.Array({
      displayName: 'Row IDs',
      required: true,
    }),
  },
  async run(context) {
    const { retable_id, row_ids } = context.propsValue;
    const parsedRowIds = (row_ids as unknown[]).map((id) => {
      if (typeof id !== 'string' && typeof id !== 'number') {
        throw new Error(`Invalid row id: "${id}" is not an integer`);
      }
      const trimmed = String(id).trim();
      if (!/^-?\d+$/.test(trimmed)) {
        throw new Error(`Invalid row id: "${id}" is not an integer`);
      }
      return Number(trimmed);
    });
    return (
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${retableCommon.baseUrl}/retable/${retable_id}/data`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        body: {
          row_ids: parsedRowIds,
        },
      })
    ).body;
  },
});
