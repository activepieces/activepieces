import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { DynamicPropsValue, Property, TriggerHookContext } from "@activepieces/pieces-framework";
import { CreateTableWebhookRequest, Field, FieldType, MarkdownVariant, PopulatedRecord, SeekPage, Table, TableWebhookEventType } from "@activepieces/shared";
import { z } from 'zod';

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
export const tablesCommon = {
  table_id: Property.Dropdown({
    displayName: 'Table Name',
    description: 'The name of the table to insert records into.',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async (propsValue, context) => {
      try {
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
          return {
            options: [],
            disabled: true,
            placeholder: 'No tables found. Please create a table first.',
          };
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

        return {
          options: tables.map((table: Table) => ({ label: table.name, value: table.id })),
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
        const description = `${field.type[0] + field.type.slice(1).toLowerCase()}.`;

        switch (field.type) {
          case FieldType.NUMBER:
            fields[field.id] = Property.Number({
              displayName: field.name,
              description,
              required: false,
            });
            break;
          case FieldType.DATE:
            fields[field.id] = Property.DateTime({
              displayName: field.name,
              description,
              required: false,
            });
            break;
          default:
            fields[field.id] = Property.ShortText({
              displayName: field.name,
              description,
              required: false,
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
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/records/list`,
      body: {
        tableId,
        limit
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });

    return response.body.data.map(this.formatRecord);

  },
  formatRecord(record: PopulatedRecord): FormattedRecord {
    return {
      id: record.id,
      created: record.created,
      updated: record.updated,
      cells: Object.fromEntries(Object.entries(record.cells).map(([fieldId, cell]) => {
        return [fieldId, {
          fieldName: cell.fieldName,
          updated: cell.updated,
          created: cell.created,
          value: cell.value 
        }]
      })),
    }
  }
}