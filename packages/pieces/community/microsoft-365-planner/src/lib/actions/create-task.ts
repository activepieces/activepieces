import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { BucketDropdown, PlanDropdown } from '../common/properties';

export const createTask = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description:
    'Create a new planner task with title, assignments, due date, etc.',
  props: {
    planId: PlanDropdown({ required: true }),
    bucketId: BucketDropdown({ required: false }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task to be created',
      required: true,
    }),
    assignments: Property.MultiSelectDropdown({
      displayName: 'Assignments',
      description:
        'Select users to assign the task to. If left empty, the task will be unassigned.',
      required: false,
      auth: microsoft365PlannerAuth,
      refreshers: ['auth'],
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
    const taskParams = {
      ...propsValue,
      assignments: propsValue.assignments
        ? Object.fromEntries(
            propsValue.assignments.map((userId) => [
              userId,
              { '@odata.type': 'microsoft.graph.plannerAssignment' },
            ])
          )
        : undefined,
      dueDateTime: propsValue.dueDateTime 
        ? new Date(propsValue.dueDateTime).toISOString()
        : undefined,
      startDateTime: propsValue.startDateTime 
        ? new Date(propsValue.startDateTime).toISOString()
        : undefined,
    };
    return await microsoft365PlannerCommon.createTask({
      auth,
      ...taskParams,
    });
  },
});
