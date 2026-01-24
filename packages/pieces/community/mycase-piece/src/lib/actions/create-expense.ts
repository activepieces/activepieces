import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createExpense = createAction({
  auth: mycaseAuth,
  name: 'create_expense',
  displayName: 'Create Expense',
  description: 'Creates a new expense in MyCase',
  props: {
    activity_name: Property.ShortText({
      displayName: 'Activity Name',
      description: 'The activity name for this expense (will be created if it doesn\'t exist)',
      required: true,
    }),
    case: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Case',
      description: 'The case to associate with this expense',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/cases', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((caseItem: any) => ({
              label: `${caseItem.name}${caseItem.case_number ? ` (${caseItem.case_number})` : ''}`,
              value: caseItem.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load cases',
        };
      },
    }),
    entry_date: Property.DateTime({
      displayName: 'Entry Date',
      description: 'The entry date of this expense',
      required: true,
    }),
    cost: Property.Number({
      displayName: 'Cost',
      description: 'Cost of the expense',
      required: true,
    }),
    units: Property.Number({
      displayName: 'Units',
      description: 'Number of units',
      required: true,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Is this expense billable?',
      required: true,
      defaultValue: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the expense',
      required: false,
    }),
    staff: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Staff',
      description: 'The staff member associated with this expense',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/staff', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((staff: any) => ({
              label: `${staff.first_name} ${staff.last_name}`,
              value: staff.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load staff',
        };
      },
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      activity_name: context.propsValue.activity_name,
      case: { id: parseInt(context.propsValue.case) },
      entry_date: new Date(context.propsValue.entry_date).toISOString().split('T')[0],
      cost: context.propsValue.cost,
      units: context.propsValue.units,
      billable: context.propsValue.billable,
    };

    // Add optional fields
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }

    if (context.propsValue.staff) {
      requestBody.staff = { id: parseInt(context.propsValue.staff) };
    }

    try {
      const response = await api.post('/expenses', requestBody);
      
      if (response.success) {
        return {
          success: true,
          expense: response.data,
          message: `Expense "${context.propsValue.activity_name}" created successfully`,
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
        error: 'Failed to create expense',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});