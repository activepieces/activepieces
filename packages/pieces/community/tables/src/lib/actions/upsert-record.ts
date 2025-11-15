import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { CreateRecordsRequest, FieldType, Filter, FilterOperator, ListRecordsRequest, PopulatedRecord, SeekPage, UpdateRecordRequest } from '@activepieces/shared';
import qs from 'qs';

export const upsertRecord = createAction({
  name: 'tables-upsert-record',
  displayName: 'Upsert Record',
  description: 'Update a record if it exists, or create a new one if it doesn\'t.',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    match_field: Property.Dropdown({
      displayName: 'Match Field',
      description: 'The field to use for matching existing records (e.g., email, ID, name)',
      required: true,
      refreshers: ['table_id'],
      options: async ({ table_id }, context) => {
        const tableExternalId = table_id as unknown as string;
        if ((tableExternalId ?? '').toString().length === 0) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Please select a table first',
          };
        }

        try {
          const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);
          const fields = await tablesCommon.getTableFields({ tableId, context });

          return {
            options: fields.map((field) => ({
              label: field.name,
              value: field.externalId,
            })),
          };
        } catch (e) {
          console.error('Error fetching fields:', e);
          return {
            options: [],
            disabled: true,
            placeholder: 'Error loading fields',
          };
        }
      },
    }),
    match_value: Property.ShortText({
      displayName: 'Match Value',
      description: 'The value to search for in the match field',
      required: true,
    }),
    values: Property.DynamicProperties({
      displayName: 'Values',
      description: 'The values to insert or update.',
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
    const { table_id: tableExternalId, match_field, match_value, values } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);

    const tableFields = await tablesCommon.getTableFields({ tableId, context });
    const fieldValidations = tablesCommon.createFieldValidations(tableFields);
    await propsValidation.validateZod(values, fieldValidations);

    // Get the match field information
    const matchFieldExternalId = match_field as string;
    const matchField = tableFields.find((field) => field.externalId === matchFieldExternalId);

    if (!matchField) {
      throw new Error(`Match field "${matchFieldExternalId}" not found in table`);
    }

    // Search for existing record
    const searchFilter: Filter = {
      fieldId: matchField.id,
      operator: FilterOperator.EQ,
      value: match_value as string,
    };

    const searchRequest: ListRecordsRequest = {
      tableId,
      limit: 1,
      cursor: undefined,
      filters: [searchFilter],
    };

    const searchResponse = await httpClient.sendRequest<SeekPage<PopulatedRecord>>({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/records?${qs.stringify(searchRequest)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      retries: 5,
    });

    const existingRecords = searchResponse.body.data;

    // Prepare cells from values
    const cells = Object.entries(values)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([fieldExternalId, value]) => ({
        fieldId: tableFields.find((field) => field.externalId === fieldExternalId)?.id ?? '',
        value,
      }))
      .filter((cell) => cell.fieldId !== '');

    if (existingRecords.length > 0) {
      // Update existing record
      const existingRecord = existingRecords[0];
      const updateRequest: UpdateRecordRequest = {
        cells,
        tableId,
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${context.server.apiUrl}v1/records/${existingRecord.id}`,
        body: updateRequest,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.server.token,
        },
        retries: 5,
      });

      return {
        ...tablesCommon.formatRecord(response.body as PopulatedRecord),
        operation: 'update',
      };
    } else {
      // Create new record
      const createRequest: CreateRecordsRequest = {
        records: [cells],
        tableId,
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${context.server.apiUrl}v1/records`,
        body: createRequest,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.server.token,
        },
        retries: 5,
      });

      const createdRecords = response.body as PopulatedRecord[];
      return {
        ...tablesCommon.formatRecord(createdRecords[0]),
        operation: 'create',
      };
    }
  },
});
