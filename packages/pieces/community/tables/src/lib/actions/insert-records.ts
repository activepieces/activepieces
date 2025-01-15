import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { CreateRecordsRequest } from '@activepieces/shared';
import { tablesCommon } from '../common';

export const insertRecords = createAction({
  name: 'tables-insert-records',
  displayName: 'Insert Records',
  description: 'Add one or more new records to a table.',
  auth: PieceAuth.None(),
  props: {
    table_name: tablesCommon.table_name,
    values: Property.DynamicProperties({
      displayName: 'Values',
      description: 'The values to insert.',
      required: true,
      refreshers: ['table_name'],
      props: async ({ table_name }, context) => {
        const tableId = table_name as unknown as string;
        if ((tableId ?? '').toString().length === 0) {
          return {};
        }

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
    const { table_name: tableId, values } = context.propsValue;

    const records: CreateRecordsRequest['records'] = values['values'].map((record: Record<string, unknown>) =>
      Object.entries(record)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => ({
          key,
          value,
        }))
    );

    const tableFields = await tablesCommon.getTableFields({ tableId, context });
    const fieldValidations = tablesCommon.createFieldValidations(tableFields);
    for (const record of values['values']) {
      await propsValidation.validateZod(record, fieldValidations);
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
    });

    return response.body;
  },
});
