import { createAction, DynamicPropsValue, PieceAuth, Property, PropertyContext } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { FieldType, Filter, FilterOperator, ListRecordsRequest, PopulatedRecord, SeekPage } from '@activepieces/shared';
import { z } from 'zod';
import qs from 'qs';
type FieldInfo = {
  id: string;
  type: FieldType;
  name: string;
};

export const findRecords = createAction({
  name: 'tables-find-records',
  displayName: 'Find Records',
  description: 'Find records in a table with filters.',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default no limit).',
      required: false,
    }),
    filters: Property.DynamicProperties({
      displayName: 'Filters',
      description: 'Filter conditions to apply',
      required: false,
      refreshers: ['table_id'],
      props: async (propsValue, context) => {
        const table_id = propsValue['table_id'];
        if (!table_id || typeof table_id !== 'string') {
          return {
            filters: Property.Array({
              displayName: 'Filters',
              required: false,
              properties: {},
            }),
          };
        }

        const convertedTableId = await tablesCommon.convertTableExternalIdToId(table_id, context);
        const fields = await tablesCommon.getTableFields({
          tableId: convertedTableId,
          context,
        });
 
        return {
          filters: Property.Array({
            displayName: 'Filters',
            required: false,
            properties: {
              field: Property.StaticDropdown({
                displayName: 'Field',
                required: true,
                options: {
                  options: fields.map((field) => ({
                    label: field.name,
                    value: { id: field.id, type: field.type, name: field.name } as FieldInfo,
                  })),
                },
              }),
              operator: Property.StaticDropdown({
                displayName: 'Operator',
                required: true,
                options: {
                  options: [
                    { label: 'Equals', value: FilterOperator.EQ },
                    { label: 'Not Equals', value: FilterOperator.NEQ },
                    { label: 'Greater Than', value: FilterOperator.GT },
                    { label: 'Greater Than or Equal', value: FilterOperator.GTE },
                    { label: 'Less Than', value: FilterOperator.LT },
                    { label: 'Less Than or Equal', value: FilterOperator.LTE },
                    { label: 'Contains', value: FilterOperator.CO },
                  ],
                },
              }),
              value: Property.ShortText({
                displayName: 'Value',
                required: true,
              }),
            },
          }),
        };
      },
    }),
  },
  async run(context) {
    const { table_id: tableExternalId, limit, filters } = context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);
    const filtersArray: { field: FieldInfo; operator: FilterOperator; value: unknown }[] = filters?.['filters'] ?? [];

    for (const filter of filtersArray) {
      const value = filter.value;
      const fieldType = filter.field.type;

      let schema: Record<string, z.ZodType>;
      switch (fieldType) {
        case FieldType.NUMBER:
          schema = {
            value: z.union([z.number(), z.string().transform(val => {
              const num = Number(val);
              if (isNaN(num)) throw new Error(`Invalid number for field "${filter.field.name}"`);
              return num;
            })]),
          };
          break;
        case FieldType.DATE:
          schema = {
            value: z.union([z.date(), z.string().transform(val => {
              const date = new Date(val);
              if (isNaN(date.getTime())) throw new Error(`Invalid date for field "${filter.field.name}"`);
              return date;
            })]),
          };
          break;
        default:
          schema = {
            value: z.string(),
          };
      }

      await propsValidation.validateZod({ value }, schema);
    }

    const parsedFilters: Filter[] = filtersArray.map((filter) => ({
      fieldId: filter.field.id,
      operator: filter.operator,
      value: filter.value as string,
    }));

    const request: ListRecordsRequest = {
      tableId,
      limit: limit ?? 999999999,
      cursor: undefined,
      filters: parsedFilters,
    };


    const response = await httpClient.sendRequest<SeekPage<PopulatedRecord>>({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/records?${qs.stringify(request)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      retries: 5,
    });

    return response.body.data.map(tablesCommon.formatRecord);
  },
});
