import {
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../../';
import { BaserowClient } from './client';
import { BaserowFieldType } from './constants';

export function makeClient(
  auth: PiecePropValueSchema<typeof baserowAuth>
): BaserowClient {
  const client = new BaserowClient(auth.apiUrl, auth.token);
  return client;
}
export const baserowCommon = {
  tableFields: (required = true) =>
    Property.DynamicProperties({
      displayName: 'Table Fields',
      required,
      refreshers: ['table_id'],
      props: async ({ auth, table_id }) => {
        if (!auth || !table_id) return {};

        const fields: DynamicPropsValue = {};
        try {
          const client = makeClient(
            auth as PiecePropValueSchema<typeof baserowAuth>
          );
          const tableFields = await client.listTableFields(
            table_id as unknown as number
          );
          for (const field of tableFields) {
            if (
              !field.read_only &&
              ![BaserowFieldType.FILE].includes(field.type)
            ) {
              switch (field.type) {
                case BaserowFieldType.BOOLEAN:
                  fields[field.name] = Property.Checkbox({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.RATING:
                  fields[field.name] = Property.Number({
                    displayName: field.name,
                    required: false,
                    description: `Enter valid value between 1 and ${field.max_value}.`,
                  });
                  break;
                case BaserowFieldType.DATE:
                  fields[field.name] = Property.DateTime({
                    displayName: field.name,
                    required: false,
                    description: `Enter date in ${field.date_format} format ${
                      field.date_include_time
                        ? 'and time in ' +
                          field.date_time_format +
                          ' hour format'
                        : ''
                    }.`,
                  });
                  break;
                case BaserowFieldType.DURATION:
                  fields[field.name] = Property.Number({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.LINK_TO_TABLE:
                  fields[field.name] = Property.Array({
                    displayName: field.name,
                    required: false,

                    description: `Enter row ids from table(ID: ${field.link_row_table_id}) that you want to link to.`,
                  });
                  break;
                case BaserowFieldType.LONG_TEXT:
                  fields[field.name] = Property.LongText({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.MULTIPLE_COLLABORATORS:
                  fields[field.name] = Property.Array({
                    displayName: field.name,
                    required: false,
                    description: 'Enter user ids that you want to link to.',
                  });
                  break;
                case BaserowFieldType.SINGLE_SELECT:
                  fields[field.name] = Property.StaticDropdown({
                    displayName: field.name,
                    required: false,
                    options: {
                      disabled: false,
                      options: field.select_options.map((option) => {
                        return {
                          label: option.value,
                          value: option.value,
                        };
                      }),
                    },
                  });
                  break;
                case BaserowFieldType.MULTI_SELECT:
                  fields[field.name] = Property.StaticMultiSelectDropdown({
                    displayName: field.name,
                    required: false,
                    options: {
                      disabled: false,
                      options: field.select_options.map((option) => {
                        return {
                          label: option.value,
                          value: option.value,
                        };
                      }),
                    },
                  });
                  break;
                case BaserowFieldType.NUMBER:
                  fields[field.name] = Property.Number({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.EMAIL:
                case BaserowFieldType.PHONE_NUMBER:
                  fields[field.name] = Property.ShortText({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.TEXT:
                  fields[field.name] = Property.ShortText({
                    displayName: field.name,
                    required: false,
                    defaultValue: field.text_default,
                  });
                  break;
                case BaserowFieldType.URL:
                  fields[field.name] = Property.ShortText({
                    displayName: field.name,
                    required: false,
                  });
                  break;
              }
            }
          }
        } catch (error) {
          console.log('Invalid Baserow Table ID.');
        }
        return fields;
      },
    }),
};
