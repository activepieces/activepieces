import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { PopulatedRecord, UpdateRecordRequest } from '@activepieces/pieces-framework';
import { updateRecordActionOutputSchema } from '../output-schemas';

export const updateRecord = createAction({
  audience: 'both',
  name: 'tables-update-record',
  displayName: 'Update Record',
  description: 'Update values in an existing record',
  aiMetadata: { description: 'Overwrites cell values on one existing Activepieces Table record addressed by its record ID, changing only the columns supplied - blank values are skipped and keep whatever the record already holds. Pick this to modify a known row; use Create Record(s) to insert new rows, since this action only edits a record that already exists. Requires both the table ID and the record ID, and each value is validated against the type of its column; idempotent, since re-applying the same values leaves the record unchanged.', idempotent: true },
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    record_id: tablesCommon.record_id,
    values: Property.DynamicProperties({
      auth: PieceAuth.None(),
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
  outputSchema: updateRecordActionOutputSchema,
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
      retries: 5,
    });

    return tablesCommon.formatRecord(response.body as PopulatedRecord);
  },
});
