import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import { caseDropdown, multiStaffDropdown } from '../common/props';

export const createTask = createAction({
  auth: myCaseAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Create a new task',
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Task description',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Task priority level',
      required: true,
      options: {
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      },
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due',
      required: true,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Mark task as completed',
      required: false,
      defaultValue: false,
    }),
    case_id: caseDropdown({
      description: 'Associate task with a case',
      required: false,
    }),
    staff_ids: multiStaffDropdown({
      description: 'Assign staff members to this task',
      required: true,
    }),
  },
  async run(context) {
    const {
      auth,
      propsValue: { staff_ids = [], ...otherProps },
    } = context;

    const staff = staff_ids.map((staffId: number) => ({
      id: staffId,
    }));

    const payload: any = {
      name: otherProps.name,
      description: otherProps.description,
      priority: otherProps.priority,
      due_date: otherProps.due_date,
      completed: otherProps.completed,
      staff,
    };

    if (otherProps.case_id) {
      payload.case = { id: otherProps.case_id };
    }

    return await myCaseApiService.createTask({
      accessToken: auth.access_token,
      payload,
    });
  },
});
