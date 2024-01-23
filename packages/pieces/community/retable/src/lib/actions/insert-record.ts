import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableCreateRecordAction = createAction({
  auth: retableAuth,
  name: 'retable_create_record',
  displayName: 'Create Retable Record',
  description: 'Adds a record into a retable',
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
          ApiKey: context.auth as string,
        },
        body: {
          data: [{ columns: outputData }],
        },
      })
    ).body;
  },
});
