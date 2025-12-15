import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createTask = createAction({
  auth: mycaseAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task in MyCase',
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of this task',
      required: true,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority of this task',
      required: true,
      options: {
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      },
      defaultValue: 'Medium',
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'The due date of this task',
      required: true,
    }),
    staff: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Staff',
      description: 'Staff members to assign this task to',
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
    description: Property.LongText({
      displayName: 'Description',
      description: 'Task description',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Is this task completed?',
      required: false,
      defaultValue: false,
    }),
    case: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Case',
      description: 'The case to associate with this task',
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
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Validate that staff is selected
    if (!context.propsValue.staff || !Array.isArray(context.propsValue.staff) || context.propsValue.staff.length === 0) {
      return {
        success: false,
        error: 'At least one staff member must be selected',
      };
    }

    // Build the request body
    const requestBody: any = {
      name: context.propsValue.name,
      priority: context.propsValue.priority,
      due_date: new Date(context.propsValue.due_date).toISOString().split('T')[0],
      staff: context.propsValue.staff.map((staffId: string) => ({
        id: parseInt(staffId),
      })),
    };

    // Add optional fields
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }

    if (context.propsValue.completed !== undefined) {
      requestBody.completed = context.propsValue.completed;
    }

    if (context.propsValue.case) {
      requestBody.case = { id: parseInt(context.propsValue.case) };
    }

    try {
      const response = await api.post('/tasks', requestBody);
      
      if (response.success) {
        return {
          success: true,
          task: response.data,
          message: `Task "${context.propsValue.name}" created successfully`,
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
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});