import { createAction, MarkdownVariant, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { CreateRecordsRequest } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';

export const createRecords = createAction({
  audience: 'human',
  name: 'tables-create-records',
  displayName: 'Create Record(s)',
  description: 'Insert one or more new records to a table.',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    values: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Records',
      description: 'The records to create.',
      required: true,
      refreshers: ['table_id'],
      props: async ({ table_id }, context) => {
        const tableExternalId = table_id as unknown as string;
        if ((tableExternalId ?? '').toString().length === 0) {
          return {};
        }
        try {
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
        } catch {
          return {
            markdown: Property.MarkDown({
              value:
                "Couldn't load the fields for this table. If it's selected dynamically (e.g. from a previous step), use the \"Records (Raw)\" field below to provide records as JSON.",
              variant: MarkdownVariant.INFO,
            }),
          };
        }
      },
    }),
    records: Property.Json({
      displayName: 'Records (Raw)',
      description:
        'Advanced: provide records as a JSON array of objects keyed by field name, e.g. [{"Name":"John","Age":30}]. Use this when the table is selected dynamically (its columns are unknown at build time). When set, this overrides the Records form above.',
      required: false,
    }),
  },
  async run(context) {
    const { table_id: tableExternalId, values, records: rawRecords } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);
    const tableFields = await tablesCommon.getTableFields({ tableId, context });

    let records: CreateRecordsRequest['records'];
    if (rawRecords != null) {
      const rawArray = Array.isArray(rawRecords) ? rawRecords : [rawRecords];
      records = toCells({ rows: rawArray, fieldIdByKey: (name) => tableFields.find((field) => field.name === name)?.id });
    } else {
      const formRecords = values['values'];
      if (!Array.isArray(formRecords) || formRecords.length === 0) {
        throw new Error(
          'No records provided. Select a table and fill in the records form, or use the "Records (Raw)" field to provide records as JSON.'
        );
      }
      records = toCells({ rows: formRecords, fieldIdByKey: (externalId) => tableFields.find((field) => field.externalId === externalId)?.id });
      const fieldValidations = tablesCommon.createFieldValidations(tableFields);
      for (const record of formRecords) {
        const cleanedRecord = Object.fromEntries(Object.entries(record).filter(([_, value]) => value != null && value !== ''));
        await propsValidation.validateZod(cleanedRecord, fieldValidations);
      }
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

function toCells({ rows, fieldIdByKey }: {
  rows: Record<string, unknown>[];
  fieldIdByKey: (key: string) => string | undefined;
}): CreateRecordsRequest['records'] {
  return rows.map((row) =>
    Object.entries(row)
      .filter(([_, value]) => value != null && value !== '')
      .map(([key, value]) => ({ fieldId: fieldIdByKey(key), value: String(value) }))
      .filter((cell): cell is { fieldId: string; value: string } => cell.fieldId !== undefined)
  );
}
