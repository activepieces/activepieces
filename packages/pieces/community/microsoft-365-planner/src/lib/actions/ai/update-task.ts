import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerUtils } from '../../common/utils';
import { microsoft365PlannerTaskOutputSchema } from '../../output-schemas';

export const updateTaskAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_update_task',
  outputSchema: microsoft365PlannerTaskOutputSchema,
  displayName: 'Update Task',
  description: 'Updates fields of a Planner task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes any of a Planner task’s title, bucket (same plan), assignees (add or remove), dates (set or clear), priority, percent complete and label categories (add or remove), and returns the updated task. Only the fields you set change. For a single change prefer Complete Task, Assign Task or Move Task; for description and checklist use Update Task Details.',
    idempotent: true,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title.',
      required: false,
    }),
    bucketId: microsoft365PlannerAiProps.bucketId({
      required: false,
      description: 'Move the task to this bucket of the same plan.',
    }),
    assignUserIds: microsoft365PlannerAiProps.userIds({
      required: false,
      displayName: 'Assign User IDs',
      description:
        'User IDs to add as assignees (existing assignees stay). From List Group Members or Get Current User.',
    }),
    unassignUserIds: microsoft365PlannerAiProps.userIds({
      required: false,
      displayName: 'Unassign User IDs',
      description: 'User IDs to remove from the assignees.',
    }),
    dueDateTime: Property.DateTime({
      displayName: 'Due Date',
      description: 'New due date and time, ISO 8601.',
      required: false,
    }),
    clearDueDate: Property.Checkbox({
      displayName: 'Clear Due Date',
      description: 'Remove the due date. Cannot be combined with Due Date.',
      required: false,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date',
      description: 'New start date and time, ISO 8601.',
      required: false,
    }),
    clearStartDate: Property.Checkbox({
      displayName: 'Clear Start Date',
      description: 'Remove the start date. Cannot be combined with Start Date.',
      required: false,
    }),
    percentComplete: Property.Number({
      displayName: 'Percent Complete',
      description: 'Progress from 0 to 100; 100 marks the task completed.',
      required: false,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description:
        'Priority from 0 (highest) to 10 (lowest). Planner shows 1 as urgent, 3 as important, 5 as medium and 9 as low.',
      required: false,
    }),
    addCategories: Property.Array({
      displayName: 'Add Label Categories',
      description: 'Label categories to apply, e.g. ["category1"].',
      required: false,
    }),
    removeCategories: Property.Array({
      displayName: 'Remove Label Categories',
      description: 'Label categories to remove, e.g. ["category2"].',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const assign = microsoft365PlannerUtils.stringIds({
      value: propsValue.assignUserIds,
      propName: 'Assign User IDs',
    });
    const unassign = microsoft365PlannerUtils.stringIds({
      value: propsValue.unassignUserIds,
      propName: 'Unassign User IDs',
    });
    const addCategories = microsoft365PlannerUtils.stringIds({
      value: propsValue.addCategories,
      propName: 'Add Label Categories',
    });
    const removeCategories = microsoft365PlannerUtils.stringIds({
      value: propsValue.removeCategories,
      propName: 'Remove Label Categories',
    });
    if (assign.some((id) => unassign.includes(id))) {
      throw new Error(
        'A user cannot be in both Assign User IDs and Unassign User IDs.'
      );
    }
    if (addCategories.some((category) => removeCategories.includes(category))) {
      throw new Error(
        'A category cannot be in both Add Label Categories and Remove Label Categories.'
      );
    }
    if (propsValue.dueDateTime !== undefined && propsValue.clearDueDate) {
      throw new Error('Set Due Date or Clear Due Date, not both.');
    }
    if (propsValue.startDateTime !== undefined && propsValue.clearStartDate) {
      throw new Error('Set Start Date or Clear Start Date, not both.');
    }
    const fields = {
      ...(propsValue.title !== undefined ? { title: propsValue.title } : {}),
      ...(propsValue.bucketId !== undefined
        ? { bucketId: propsValue.bucketId }
        : {}),
      ...(assign.length > 0 || unassign.length > 0
        ? {
            assignments: {
              ...microsoft365PlannerUtils.assignmentsFor({ userIds: assign }),
              ...Object.fromEntries(unassign.map((id) => [id, null])),
            },
          }
        : {}),
      ...(propsValue.dueDateTime !== undefined
        ? { dueDateTime: propsValue.dueDateTime }
        : {}),
      ...(propsValue.clearDueDate ? { dueDateTime: null } : {}),
      ...(propsValue.startDateTime !== undefined
        ? { startDateTime: propsValue.startDateTime }
        : {}),
      ...(propsValue.clearStartDate ? { startDateTime: null } : {}),
      ...(propsValue.percentComplete !== undefined
        ? { percentComplete: propsValue.percentComplete }
        : {}),
      ...(propsValue.priority !== undefined
        ? { priority: propsValue.priority }
        : {}),
      ...(addCategories.length > 0 || removeCategories.length > 0
        ? {
            appliedCategories: {
              ...Object.fromEntries(addCategories.map((c) => [c, true])),
              ...Object.fromEntries(removeCategories.map((c) => [c, false])),
            },
          }
        : {}),
    };
    if (Object.keys(fields).length === 0) {
      throw new Error('Set at least one field to change.');
    }
    return await microsoft365PlannerApi.patchTask({
      auth,
      taskId: propsValue.taskId,
      fields,
    });
  },
});
