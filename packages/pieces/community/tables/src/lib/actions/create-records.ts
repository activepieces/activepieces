import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { CreateRecordsRequest } from '@activepieces/shared';
import { tablesCommon } from '../common';

export const createRecords = createAction({
  name: 'tables-create-records',
  displayName: 'Create Record(s)',
  description: 'Insert one or more new records to a table.',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    values: Property.DynamicProperties({
      displayName: 'Records',
      description: 'The records to create.',
      required: true,
      refreshers: ['table_id'],
      props: async ({ table_id }, context) => {
        const tableExternalId = table_id as unknown as string;
        if ((tableExternalId ?? '').toString().length === 0) {
          return {};
        }
        const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);
        
        const fields = await tablesCommon.createFieldProperties({ tableId, context });
        if ('markdown' in fields) {
          return fields;
        }

        return {
          values: Property.Array({
            displayName: 'Records',
            description: 'Add one or more records to insert',
            required: true,
            properties: fields,
          }),
        };
      },
    }),
  },
  async run(context) {
    const { table_id: tableExternalId, values } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);
    const tableFields = await tablesCommon.getTableFields({ tableId, context });

    const records: CreateRecordsRequest['records'] = values['values'].map((record: Record<string, unknown>) =>
      Object.entries(record)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([fieldExternalId, value]) => ({
          fieldId: tableFields.find((field) => field.externalId === fieldExternalId)?.id,
          value,
        })).filter((record) => record.fieldId !== undefined)
    )
    const fieldValidations = tablesCommon.createFieldValidations(tableFields);

    for (const record of values['values']) {
      const cleanedRecord = Object.fromEntries(Object.entries(record).filter(([_, value]) => value !== null && value !== undefined && value !== ''));
      await propsValidation.validateZod(cleanedRecord, fieldValidations);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/records`,
      body: {
        records,
        tableId,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      retries: 5,
    });

    return response.body.map(tablesCommon.formatRecord);
  },
});
