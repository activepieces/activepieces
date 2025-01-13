import { createAction, DynamicPropsValue, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { Table, Field, FieldType, MarkdownVariant, CreateRecordsRequest } from '@activepieces/shared';
import { z } from 'zod';

export const insertRecords = createAction({
  auth: PieceAuth.None(),
  name: 'tables-insert-records',
  displayName: 'Insert Records',
  description: 'Add one or more new records to a table.',
  props: {
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

        const fields: DynamicPropsValue = {};

        try {
          // Get table fields
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

          const tableFields: Field[] = fieldsResponse.body;
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

          return {
            values: Property.Array({
              displayName: 'Records',
              description: 'Add one or more records to insert',
              required: true,
              properties: fields,
            }),
          };
        } catch (e) {
          console.error('Error fetching fields:', e);
          fields['markdown'] = Property.MarkDown({
            value: `We couldn't find any fields in the selected table. Please add fields to the table first.`,
            variant: MarkdownVariant.INFO,
          });

          return fields;
        }
      },
    }),
  },
  async run(context) {
    const { table_name: tableId, values } = context.propsValue;

    try {
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

      const tableFields: Field[] = fieldsResponse.body;

      const fieldValidations: Record<string, z.ZodType> = {};
      tableFields.forEach(field => {
        switch (field.type) {
          case FieldType.NUMBER:
            fieldValidations[field.name] = z.union([z.number(), z.string().transform(val => {
              const num = Number(val);
              if (isNaN(num)) throw new Error(`Invalid number for field "${field.name}"`);
              return num;
            })]).nullable();
            break;
          case FieldType.DATE:
            fieldValidations[field.name] = z.union([z.date(), z.string().transform(val => {
              const date = new Date(val);
              if (isNaN(date.getTime())) throw new Error(`Invalid date for field "${field.name}"`);
              return date;
            })]).nullable();
            break;
          default:
            fieldValidations[field.name] = z.string().nullable();
        }
      });

      for (const record of values['values']) {
        await propsValidation.validateZod(record, fieldValidations);
      }

      const records: CreateRecordsRequest['records'] = values['values'].map((record: Record<string, any>) => {
        return Object.entries(record)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      });

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to insert records: ' + String(error));
    }
  },
});
