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
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date in ISO 8601 format (YYYY-MM-DD)',
      required: true,
    }),
    staff_id: Property.Number({
      displayName: 'Staff ID',
      description: 'ID of staff member to assign this task to',
      required: true,
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
    case_id: Property.Number({
      displayName: 'Case ID',
      description: 'ID of the case to associate with this task',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      name: context.propsValue.name,
      priority: context.propsValue.priority,
      due_date: context.propsValue.due_date,
      staff: [{
        id: context.propsValue.staff_id,
      }],
    };

    // Add optional fields
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    
    if (context.propsValue.completed !== undefined) {
      requestBody.completed = context.propsValue.completed;
    }
    
    if (context.propsValue.case_id) {
      requestBody.case = { id: context.propsValue.case_id };
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