import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { PopulatedRecord, UpdateRecordRequest } from '@activepieces/shared';

export const updateRecord = createAction({
  name: 'tables-update-record',
  displayName: 'Update Record',
  description: 'Update values in an existing record',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    record_id: tablesCommon.record_id,
    values: Property.DynamicProperties({
      displayName: 'Values',
      description: 'The values to update. Leave empty to keep current value.',
      required: true,
      refreshers: ['table_id'],
      props: async ({ table_id }, context) => {
        const tableExternalId = table_id as unknown as string;
        const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);
        if ((tableId ?? '').toString().length === 0) {
          return {};
        }

        return tablesCommon.createFieldProperties({ tableId, context });
      },
    }),
  },
  async run(context) {
    const { table_id: tableExternalId, record_id, values } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);

    const tableFields = await tablesCommon.getTableFields({ tableId, context });
    const fieldValidations = tablesCommon.createFieldValidations(tableFields);
    await propsValidation.validateZod(values, fieldValidations);

    const cells: UpdateRecordRequest['cells'] = Object.entries(values)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([fieldExternalId, value]) => ({
        fieldId: tableFields.find((field) => field.externalId === fieldExternalId)?.id ?? '',
        value,
      })).filter((cell) => cell.fieldId !== '');

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

    return tablesCommon.formatRecord(response.body as PopulatedRecord);
  },
});
