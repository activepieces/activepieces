import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createTimeEntry = createAction({
  auth: mycaseAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Creates a new time entry in MyCase',
  props: {
    activity_name: Property.ShortText({
      displayName: 'Activity Name',
      description: 'The activity name for this time entry',
      required: true,
    }),
    case: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Case',
      description: 'The case to associate with this time entry',
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
    staff: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Staff',
      description: 'The staff member associated with this time entry',
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
    entry_date: Property.DateTime({
      displayName: 'Entry Date',
      description: 'The entry date of this time entry',
      required: true,
    }),
    rate: Property.Number({
      displayName: 'Rate',
      description: 'The rate in dollars',
      required: true,
    }),
    hours: Property.Number({
      displayName: 'Hours',
      description: 'The duration in hours',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the time entry',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Is this time entry billable?',
      required: false,
      defaultValue: true,
    }),
    flat_fee: Property.Checkbox({
      displayName: 'Flat Fee',
      description: 'Is this time entry a flat fee?',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      activity_name: context.propsValue.activity_name,
      case: { id: parseInt(context.propsValue.case) },
      staff: { id: parseInt(context.propsValue.staff) },
      entry_date: new Date(context.propsValue.entry_date).toISOString().split('T')[0],
      rate: context.propsValue.rate,
      hours: context.propsValue.hours,
    };

    // Add optional fields
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    
    if (context.propsValue.billable !== undefined) {
      requestBody.billable = context.propsValue.billable;
    }
    
    if (context.propsValue.flat_fee !== undefined) {
      requestBody.flat_fee = context.propsValue.flat_fee;
    }

    try {
      const response = await api.post('/time_entries', requestBody);
      
      if (response.success) {
        return {
          success: true,
          time_entry: response.data,
          message: `Time entry "${context.propsValue.activity_name}" created successfully`,
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
        error: 'Failed to create time entry',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});