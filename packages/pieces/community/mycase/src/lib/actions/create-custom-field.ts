import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const createCustomField = createAction({
  auth: myCaseAuth,
  name: 'createCustomField',
  displayName: 'Create Custom Field',
  description: 'Creates a new custom field',
  props: {
    name: Property.ShortText({
      displayName: 'Field Name',
      description: 'The name of the custom field',
      required: true,
    }),
    parent_type: Property.StaticDropdown({
      displayName: 'Parent Type',
      description: 'The parent resource type of the custom field',
      required: true,
      options: {
        options: [
          { label: 'Case', value: 'case' },
          { label: 'Client', value: 'client' },
          { label: 'Company', value: 'company' },
          { label: 'Expense', value: 'expense' },
          { label: 'Time', value: 'time' },
          { label: 'Time and Expense', value: 'time_and_expense' },
        ],
      },
    }),
    field_type: Property.StaticDropdown({
      displayName: 'Field Type',
      description: 'The type of custom field',
      required: true,
      options: {
        options: [
          { label: 'Short Text', value: 'short_text' },
          { label: 'Long Text', value: 'long_text' },
          { label: 'Numeric', value: 'numeric' },
          { label: 'Boolean', value: 'boolean' },
          { label: 'Date', value: 'date' },
          { label: 'List', value: 'list' },
          { label: 'Currency', value: 'currency' },
        ],
      },
    }),
    list_options_fields: Property.DynamicProperties({
      displayName: 'List Options',
      description: 'Options for list type field',
      required: false,
      refreshers: ['field_type'],
      props: async (propsValue) => {
        const fieldType = propsValue['field_type'] as any;

        if (fieldType !== 'list') {
          return {};
        }

        const listProperties = {
          list_options: Property.Array({
            displayName: 'List Options',
            description: 'Enter list options',
            required: true,
            properties: {
              option_value: Property.ShortText({
                displayName: 'Option Value',
                description: 'The name of the list option',
                required: true,
              }),
            },
          }),
        };

        return listProperties;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const listOptionsFields = (propsValue.list_options_fields as any) || {};

    const payload: any = {
      name: propsValue.name,
      parent_type: propsValue.parent_type,
      field_type: propsValue.field_type,
    };

    if (propsValue.field_type === 'list' && listOptionsFields.list_options) {
      payload.list_options = listOptionsFields.list_options.map((opt: string) => {
        option_value: opt
      });
    }

    return await myCaseApiService.createCustomField({
      accessToken: auth.access_token,
      payload,
    });
  },
});
