import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableCreateRecordAction = createAction({
  auth: retableAuth,
  name: 'retable_create_record',
  displayName: 'Create Retable Record',
  description: 'Adds a record into a retable',
  audience: 'both',
  aiMetadata: { description: 'Appends a new row to a Retable table, mapping the supplied column values into a single record. Use to write data into a specific retable; requires the workspace, project, and retable identifiers plus the field values (empty cell values are skipped). Not idempotent — each call inserts another record.', idempotent: false },
  props: {
    workspace_id: retableCommon.workspace_id(),
    project_id: retableCommon.project_id(),
    retable_id: retableCommon.retable_id(),
    fields: retableCommon.fields,
  },
  async run(context) {
    const { retable_id } = context.propsValue;
    const fields = context.propsValue.fields;
    const outputData = Object.entries(fields)
      .map(([column_id, cell_value]) => {
        if (cell_value !== '') {
          return {
            column_id,
            cell_value,
          };
        }
        return null; // Skip empty cell values
      })
      .filter((entry) => entry !== null);

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${retableCommon.baseUrl}/retable/${retable_id}/data`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        body: {
          data: [{ columns: outputData }],
        },
      })
    ).body;
  },
});
