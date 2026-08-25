import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { PlanDropdown } from '../common/properties';

export const findTask = createAction({
  auth: microsoft365PlannerAuth,
  name: 'findTask',
  displayName: 'Find Task',
  description: 'Find task by fields.',
  audience: 'both',
  aiMetadata: {
    description: 'Searches the tasks of a given Planner plan and returns those whose title contains the given text (case-insensitive substring match). Use to locate a task ID within a known plan. Read-only and idempotent; both plan ID and title are required.',
    idempotent: true,
  },
  props: {
    planId: PlanDropdown({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue: { title, planId } }) {
    if (!planId) {
      throw new Error('Plan ID is required to fetch tasks.');
    }
    const tasks = await microsoft365PlannerCommon.listTasks({ auth, planId });
    return tasks.filter(
      (task) =>
        task.title && task.title.toLowerCase().includes(title.toLowerCase())
    );
  },
});
