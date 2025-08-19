import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { DynamicPropsValue, Property } from "@activepieces/pieces-framework";
import { assertNotNullOrUndefined, CreateTableWebhookRequest, Field, FieldType, MarkdownVariant, PopulatedRecord, SeekPage, StaticDropdownEmptyOption, Table, TableWebhookEventType, ListTablesRequest } from "@activepieces/shared";
import { z } from 'zod';
import qs from 'qs';

type FormattedRecord = {
  id: string;
  created: string;
  updated: string;
  cells: Record<string, {
    fieldName: string;
    updated: string;
    created: string;
    value: unknown;
  }>;
}
const getFieldTypeText = (fieldType: FieldType) => {
  switch (fieldType) {
    case FieldType.STATIC_DROPDOWN:
      return 'Single Select';
    case FieldType.DATE:
      return 'Date';
    case FieldType.NUMBER:
      return 'Number';
    case FieldType.TEXT:
      return 'Text';
  }
}
export const tablesCommon = {
  table_id: Property.Dropdown({
    displayName: 'Table Name',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async (_propsValue, context) => {
      try {
        const tables = await fetchAllTables(context);
        if (!Array.isArray(tables) || tables.length === 0) {
          return {
            options: [],
            disabled: true,
            placeholder: 'No tables found. Please create a table first.',
          };
        }
        return {
          options: tables.map((table: Table) => ({ label: table.name, value: table.externalId })),
        };
      } catch (e) {
        console.error('Error fetching tables:', e);
        return {
          options: [],
          disabled: true,
          placeholder: 'Error loading tables. Please try again.',
        };
      }
    },
  }),

  record_id: Property.ShortText({
    displayName: 'Record ID',
    description: 'The ID of the record to do the action on.',
    required: true,
  }),

  async getTableFields({ tableId, context }: { tableId: string, context: { server: { apiUrl: string, token: string } } }) {
    const fieldsResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/fields`,
      queryParams: {
        tableId,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });

    return fieldsResponse.body as Field[];
  },

  createFieldValidations(tableFields: Field[]) {
    const fieldValidations: Record<string, z.ZodType> = {};
    tableFields.forEach(field => {
      switch (field.type) {
        case FieldType.NUMBER:
          fieldValidations[field.id] = z.union([z.number(), z.string().transform(val => {
            const num = Number(val);
            if (isNaN(num)) throw new Error(`Invalid number for field "${field.name}"`);
            return num;
          })]).optional();
          break;
        case FieldType.DATE:
          fieldValidations[field.id] = z.union([z.date(), z.string().transform(val => {
            const date = new Date(val);
            if (isNaN(date.getTime())) throw new Error(`Invalid date for field "${field.name}"`);
            return date;
          })]).optional();
          break;
        default:
          fieldValidations[field.id] = z.string().optional();
      }
    });
    return fieldValidations;
  },

  async createFieldProperties({ tableId, context }: { tableId: string, context: { server: { apiUrl: string, token: string } } }): Promise<DynamicPropsValue> {
    const fields: DynamicPropsValue = {};

    try {
      const tableFields = await this.getTableFields({ tableId, context });
      if (!Array.isArray(tableFields) || tableFields.length === 0) {
        fields['markdown'] = Property.MarkDown({
          value: `We couldn't find any fields in the selected table. Please add fields to the table first.`,
          variant: MarkdownVariant.INFO,
        });
        return fields;
      }

      for (const field of tableFields) {
        const description = getFieldTypeText(field.type);

        switch (field.type) {
          case FieldType.NUMBER:
            fields[field.externalId] = Property.Number({
              displayName: field.name,
              description,
              required: false,
            });
            break;
          case FieldType.DATE:
            fields[field.externalId] = Property.DateTime({
              displayName: field.name,
              description,
              required: false,
            });
            break;
          case FieldType.STATIC_DROPDOWN:
            fields[field.externalId] = Property.StaticDropdown({
              displayName: field.name,
              description,
              defaultValue:'',
              required: false,
              options: {
                options:[StaticDropdownEmptyOption,...field.data.options.map(option => ({ label: option.value, value: option.value }))],
              },
            });
            break;
          default:
            fields[field.externalId] = Property.ShortText({
              displayName: field.name,
              description,
              required: false,
              defaultValue: '',
            });
            break;
        }
      }

      return fields;
    } catch (e) {
      console.error('Error fetching fields:', e);
      fields['markdown'] = Property.MarkDown({
        value: `We couldn't find any fields in the selected table. Please add fields to the table first.`,
        variant: MarkdownVariant.INFO,
      });

      return fields;
    }
  },

  async createWebhook({
    tableId,
    events,
    webhookUrl,
    flowId,
    server,
  }: {
    tableId: string;
    events: TableWebhookEventType[];
    webhookUrl: string;
    flowId: string;
    server: { apiUrl: string, token: string };
  }) {
    const request: CreateTableWebhookRequest = {
      events,
      webhookUrl,
      flowId,
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${server.apiUrl}v1/tables/${tableId}/webhooks`,
      body: request,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: server.token,
      },
    });

    return response.body;
  },

  async deleteWebhook({
    tableId,
    webhookId,
    server,
  }: {
    tableId: string;
    webhookId: string;
    server: { apiUrl: string, token: string };
  }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${server.apiUrl}v1/tables/${tableId}/webhooks/${webhookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: server.token,
      },
    });

    return response.body;
  },

  async getRecentRecords({
    tableId,
    limit = 5,
    context
  }: {
    tableId: string,
    limit?: number,
    context: { server: { apiUrl: string, token: string } }
  }) {
    if ((tableId ?? '').toString().length === 0) {
        throw new Error(JSON.stringify({
            message: 'Please add some records to the table before testing this trigger'
        }))
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/records?tableId=${tableId}&limit=${limit}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });

    return response.body.data.map(this.formatRecord);

  },
  formatRecord(record: PopulatedRecord | { record: PopulatedRecord }): FormattedRecord {
    const actualRecord = 'record' in record ? record.record : record;
    
    return {
      id: actualRecord.id,
      created: actualRecord.created,
      updated: actualRecord.updated,
      cells: actualRecord.cells ? Object.fromEntries(Object.entries(actualRecord.cells).map(([fieldId, cell]) => {
        return [fieldId, {
          fieldName: cell.fieldName,
          updated: cell.updated,
          created: cell.created,
          value: cell.value 
        }]
      })) : {},
    }
  },

  async convertTableExternalIdToId(tableId: string, context: { server: { apiUrl: string, token: string } }) {
    const list: ListTablesRequest = {
      externalIds: [tableId],
    }
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/tables?${qs.stringify(list)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });
    const table = (res.body as SeekPage<Table>).data[0];
    assertNotNullOrUndefined(table, `Table with externalId ${tableId} not found`);
    return table.id;
  }
}

const fetchAllTables = async (context: { server: { apiUrl: string, token: string } }): Promise<Table[]> => {
  const res = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${context.server.apiUrl}v1/tables?limit=100`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: context.server.token,
    },
  });
  const resultBody = res.body as SeekPage<Table>
  const tables = [...resultBody.data];
  if (!Array.isArray(tables) || tables.length === 0) {
    return [];
  }
  let next = resultBody.next;
  while (next) {
    const nextPage = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/tables?cursor=${next}&limit=100`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });
    const nextPageBody = nextPage.body as SeekPage<Table>
    tables.push(...nextPageBody.data)
    next = nextPageBody.next
  }
  return tables;
}