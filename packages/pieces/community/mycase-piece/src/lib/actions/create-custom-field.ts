import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createCustomField = createAction({
  auth: mycaseAuth,
  name: 'create_custom_field',
  displayName: 'Create Custom Field',
  description: 'Creates a new custom field in MyCase',
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
      description: 'The field type of the custom field',
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
    list_options: Property.Array({
      displayName: 'List Options',
      description: 'List of options for the custom field (required if field type is "list")',
      required: false,
      properties: {
        option: Property.ShortText({
          displayName: 'Option Value',
          description: 'The name of the list option',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      name: context.propsValue.name,
      parent_type: context.propsValue.parent_type,
      field_type: context.propsValue.field_type,
    };

    // Add list options if field type is list
    if (context.propsValue.field_type === 'list') {
      if (!context.propsValue.list_options || !Array.isArray(context.propsValue.list_options)) {
        return {
          success: false,
          error: 'List options are required when field type is "list"',
        };
      }
      
      if (context.propsValue.list_options.length === 0) {
        return {
          success: false,
          error: 'At least one list option must be provided',
        };
      }
      
      requestBody.list_options = context.propsValue.list_options.map((item: any) => ({
        option_value: item.option,
      }));
    }

    try {
      const response = await api.post('/custom_fields', requestBody);
      
      if (response.success) {
        return {
          success: true,
          custom_field: response.data,
          message: `Custom field "${context.propsValue.name}" created successfully`,
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create custom field',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});