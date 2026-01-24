import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { PlanDropdown, TaskDropdown } from '../common/properties';

export const updateTask = createAction({
  auth: microsoft365PlannerAuth,
  name: 'updateTask',
  displayName: 'Update Task',
  description:
    'Modify existing task fields: title, due date, assignments, descriptions.',
  props: {
    planId: PlanDropdown({ required: true }),
    id: TaskDropdown({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title of the task',
      required: false,
    }),
    assignments: Property.MultiSelectDropdown({
      displayName: 'Assignments',
      description:
        'Select users to assign the task to. If left empty, the task will be unassigned.',
      required: false,
      refreshers: ['auth'],
      auth: microsoft365PlannerAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Please select an authentication first',
          };
        }
        const users = await microsoft365PlannerCommon.listUsers({ auth: auth });
        return {
          options: users.map((user) => ({
            label: user.displayName || user.userPrincipalName || 'No Name',
            value: user.id || '',
          })),
          disabled: false,
          placeholder: 'Select users to assign the task to',
        };
      },
    }),
    dueDateTime: Property.DateTime({
      displayName: 'Due Date',
      description: 'The due date and time for the task',
      required: false,
    }),
    percentComplete: Property.Number({
      displayName: 'Percent Complete',
      description: 'The completion percentage of the task (0-100)',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description:
        'The priority of the task between 0 and 10, with the increasing value being lower priority (0 has the highest priority and 10 has the lowest priority).',
      required: false,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date',
      description: 'The start date and time for the task',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { planId, id, ...updateParams } = propsValue;
    if (!id) {
      throw new Error('Task ID is required to update a task.');
    }
    const formattedParams = {
      ...updateParams,
      assignments: updateParams.assignments
        ? Object.fromEntries(
            updateParams.assignments.map((userId) => [
              userId,
              { '@odata.type': 'microsoft.graph.plannerAssignment' },
            ])
          )
        : undefined,
    };
    return await microsoft365PlannerCommon.updateTask({
      auth,
      id,
      ...formattedParams,
    });
  },
});
