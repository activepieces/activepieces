import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerFindTaskOutputSchema } from '../output-schemas';

export const findTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'findTask',
  outputSchema: microsoft365PlannerFindTaskOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Task',
  description: 'Find task by fields.',
  audience: 'human',
  aiMetadata: {
    description: 'Searches the tasks of a given Planner plan and returns those whose title contains the given text (case-insensitive substring match). Use to locate a task ID within a known plan. Read-only and idempotent; both plan ID and title are required.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
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
    const tasks = await microsoft365PlannerApi.listTasks({ auth, planId });
    return tasks.filter(
      (task) =>
        task.title && task.title.toLowerCase().includes(title.toLowerCase())
    );
  },
});
