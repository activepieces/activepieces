import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { UpdateRecordRequest } from '@activepieces/shared';

export const updateRecord = createAction({
  name: 'tables-update-record',
  displayName: 'Update Record',
  description: 'Update values in an existing record',
  auth: PieceAuth.None(),
  props: {
    table_name: tablesCommon.table_name,
    record_id: tablesCommon.record_id,
    values: Property.DynamicProperties({
      displayName: 'Values',
      description: 'The values to update. Leave empty to keep current value.',
      required: true,
      refreshers: ['table_name', 'record_id'],
      props: async ({ table_name, record_id }, context) => {
        const tableId = table_name as unknown as string;
        const recordId = record_id as unknown as string;
        if ((tableId ?? '').toString().length === 0 || (recordId ?? '').toString().length === 0) {
          return {};
        }

        return tablesCommon.createFieldProperties({ tableId, context });
      },
    }),
  },
  async run(context) {
    const { table_name: tableId, record_id, values } = context.propsValue;

    const tableFields = await tablesCommon.getTableFields({ tableId, context });
    const fieldValidations = tablesCommon.createFieldValidations(tableFields);
    await propsValidation.validateZod(values, fieldValidations);

    const cells: UpdateRecordRequest['cells'] = Object.entries(values)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        key,
        value,
      }));

    const request: UpdateRecordRequest = {
      cells,
      tableId,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/records/${record_id}`,
      body: request,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });

    return response.body;
  },
});
