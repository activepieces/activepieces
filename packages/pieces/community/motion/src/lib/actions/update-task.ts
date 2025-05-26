import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';

interface Label {
  name: string;
}

interface AutoScheduled {
  startDate: string;
  deadlineType: string;
  schedule: string;
}

export const updateTask = createAction({
  auth: motionAuth,
  name: 'update-task',
  displayName: 'Update Task',
  description: 'Update an existing task in Motion',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Title of the task',
      required: false,
    }),
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The workspace ID the task should be associated with',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Task description in GitHub Flavored Markdown',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the task (ISO 8601)',
      required: false,
    }),
    duration: Property.ShortText({
      displayName: 'Duration',
      description: 'Duration in minutes or "NONE" or "REMINDER"',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Task status (defaults to workspace default status)',
      required: false,
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      description: 'Task priority level',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'ASAP', value: 'ASAP' },
            { label: 'HIGH', value: 'HIGH' },
            { label: 'MEDIUM', value: 'MEDIUM' },
            { label: 'LOW', value: 'LOW' },
          ],
        };
      },
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The project ID the task should be associated with',
      required: false,
    }),
    assigneeId: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The user ID the task should be assigned to',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'The names of the labels to be added to the task',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Label Name',
          required: true,
        }),
      },
    }),
    autoScheduledStartDate: Property.DateTime({
      displayName: 'Auto Schedule Start Date',
      description: 'ISO 8601 Date which is trimmed to the start of the day passed',
      required: false,
    }),
    autoScheduledDeadlineType: Property.Dropdown({
      displayName: 'Auto Schedule Deadline Type',
      description: 'Type of deadline for the task',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'HARD', value: 'HARD' },
            { label: 'SOFT', value: 'SOFT' },
            { label: 'NONE', value: 'NONE' },
          ],
        };
      },
    }),
    autoScheduledSchedule: Property.ShortText({
      displayName: 'Auto Schedule',
      description: 'Schedule the task must adhere to (must be "Work Hours" if scheduling for another user)',
      required: false,
      defaultValue: 'Work Hours',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await fetch(`https://api.usemotion.com/v1/tasks/${propsValue.taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': auth,
      },
      body: JSON.stringify({
        name: propsValue.name,
        workspaceId: propsValue.workspaceId,
        description: propsValue.description,
        dueDate: propsValue.dueDate,
        duration: propsValue.duration,
        status: propsValue.status,
        priority: propsValue.priority,
        projectId: propsValue.projectId,
        assigneeId: propsValue.assigneeId,
        labels: (propsValue.labels as Label[] | undefined)?.map(label => label.name),
        autoScheduled: (propsValue.autoScheduledStartDate || propsValue.autoScheduledDeadlineType || propsValue.autoScheduledSchedule) ? {
          startDate: propsValue.autoScheduledStartDate,
          deadlineType: propsValue.autoScheduledDeadlineType,
          schedule: propsValue.autoScheduledSchedule,
        } : null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update task: ${error.message || response.statusText}`);
    }

    return await response.json();
  },
});
