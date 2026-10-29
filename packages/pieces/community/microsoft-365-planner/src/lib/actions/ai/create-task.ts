import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerUtils } from '../../common/utils';
import { microsoft365PlannerTaskOutputSchema } from '../../output-schemas';

export const createTaskAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_create_task',
  outputSchema: microsoft365PlannerTaskOutputSchema,
  displayName: 'Create Task',
  description: 'Creates a task in a Planner plan.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new task in a Planner plan (Plan ID from List Plans), optionally in a bucket (from List Buckets), assigned to users (from List Group Members), with dates, priority, percent complete and label categories. Each call creates another task. Set the description and checklist afterwards with Update Task Details.',
    idempotent: false,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the new task.',
      required: true,
    }),
    bucketId: microsoft365PlannerAiProps.bucketId({
      required: false,
      description:
        'Bucket to put the task in (from List Buckets). Leave empty for the plan’s default placement.',
    }),
    assigneeIds: microsoft365PlannerAiProps.userIds({
      required: false,
      displayName: 'Assignee IDs',
      description:
        'User IDs to assign the task to (from List Group Members or Get Current User).',
    }),
    dueDateTime: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date and time, ISO 8601 (e.g. 2026-11-01T17:00:00Z).',
      required: false,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date and time, ISO 8601.',
      required: false,
    }),
    percentComplete: Property.Number({
      displayName: 'Percent Complete',
      description:
        'Progress from 0 to 100. Planner shows 0 as not started, 1–99 as in progress and 100 as completed.',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description:
        'Priority from 0 (highest) to 10 (lowest). Planner shows 1 as urgent, 3 as important, 5 as medium and 9 as low.',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Label Categories',
      description:
        'Label categories to apply, e.g. ["category1", "category4"]. Get Plan Details shows each category’s name.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const assigneeIds = microsoft365PlannerUtils.stringIds({
      value: propsValue.assigneeIds,
      propName: 'Assignee IDs',
    });
    const categories = microsoft365PlannerUtils.stringIds({
      value: propsValue.categories,
      propName: 'Label Categories',
    });
    return await microsoft365PlannerApi.createTask({
      auth,
      planId: propsValue.planId,
      title: propsValue.title,
      ...(propsValue.bucketId !== undefined
        ? { bucketId: propsValue.bucketId }
        : {}),
      ...(assigneeIds.length > 0
        ? {
            assignments: microsoft365PlannerUtils.assignmentsFor({
              userIds: assigneeIds,
            }),
          }
        : {}),
      ...(propsValue.dueDateTime !== undefined
        ? { dueDateTime: propsValue.dueDateTime }
        : {}),
      ...(propsValue.startDateTime !== undefined
        ? { startDateTime: propsValue.startDateTime }
        : {}),
      ...(propsValue.percentComplete !== undefined
        ? { percentComplete: propsValue.percentComplete }
        : {}),
      ...(propsValue.priority !== undefined
        ? { priority: propsValue.priority }
        : {}),
      ...(categories.length > 0
        ? {
            appliedCategories: Object.fromEntries(
              categories.map((category) => [category, true])
            ),
          }
        : {}),
    });
  },
});
