import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { DynamicPropsValue, Property } from "@activepieces/pieces-framework";
import { Field, FieldType, MarkdownVariant, Table } from "@activepieces/shared";
import { z } from 'zod';

export const tablesCommon = {
  table_name: Property.Dropdown({
    displayName: 'Table Name',
    description: 'The name of the table to insert records into.',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async (propsValue, context) => {
      try {
        const res = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${context.server.apiUrl}v1/tables`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.server.token,
          },
        });

        const tables = res.body;
        if (!Array.isArray(tables) || tables.length === 0) {
          return {
            options: [],
            disabled: true,
            placeholder: 'No tables found. Please create a table first.',
          };
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
          fieldValidations[field.name] = z.union([z.number(), z.string().transform(val => {
            const num = Number(val);
            if (isNaN(num)) throw new Error(`Invalid number for field "${field.name}"`);
            return num;
          })]).optional();
          break;
        case FieldType.DATE:
          fieldValidations[field.name] = z.union([z.date(), z.string().transform(val => {
            const date = new Date(val);
            if (isNaN(date.getTime())) throw new Error(`Invalid date for field "${field.name}"`);
            return date;
          })]).optional();
          break;
        default:
          fieldValidations[field.name] = z.string().optional();
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
            fields[field.name] = Property.Number({
              displayName: field.name,
              description,
              required: false,
            });
            break;
          case FieldType.DATE:
            fields[field.name] = Property.DateTime({
              displayName: field.name,
              description,
              required: false,
            });
            break;
          default:
            fields[field.name] = Property.ShortText({
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
  }
}