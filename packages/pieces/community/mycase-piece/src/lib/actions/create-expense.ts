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
    case_id: Property.Number({
      displayName: 'Case ID',
      description: 'ID of the case to associate with this expense',
      required: true,
    }),
    entry_date: Property.ShortText({
      displayName: 'Entry Date',
      description: 'Entry date in ISO 8601 format (YYYY-MM-DD)',
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
    staff_id: Property.Number({
      displayName: 'Staff ID',
      description: 'ID of the staff member associated with this expense',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      activity_name: context.propsValue.activity_name,
      case: { id: context.propsValue.case_id },
      entry_date: context.propsValue.entry_date,
      cost: context.propsValue.cost,
      units: context.propsValue.units,
      billable: context.propsValue.billable,
    };

    // Add optional fields
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    
    if (context.propsValue.staff_id) {
      requestBody.staff = { id: context.propsValue.staff_id };
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