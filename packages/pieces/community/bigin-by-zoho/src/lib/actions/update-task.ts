import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { COMMON_FIELDS, cleanupData, formatDateForBigin } from '../common/utils';

export const updateTaskAction = createAction({
  auth: biginAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Update an existing task in Bigin CRM',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'ID of the task to update',
      required: true
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the task',
      required: false
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the task',
      required: false
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status of the task',
      required: false,
      options: {
        options: [
          { label: 'Not Started', value: 'Not Started' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Pending Input', value: 'Pending Input' },
          { label: 'Deferred', value: 'Deferred' }
        ]
      }
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Priority level of the task',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'High' },
          { label: 'Normal', value: 'Normal' },
          { label: 'Low', value: 'Low' }
        ]
      }
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the task',
      required: false
    }),
    relatedTo: Property.ShortText({
      displayName: 'Related To',
      description: 'ID of the related record (Contact, Company, Deal, etc.)',
      required: false
    })
  },
  async run(context) {
    const {
      taskId,
      subject,
      dueDate,
      status,
      priority,
      description,
      relatedTo
    } = context.propsValue;

    const client = new BiginClient(context.auth);

    try {
      // Build task data (only include fields that are provided)
      const taskData = cleanupData({
        [COMMON_FIELDS.TASK.SUBJECT]: subject,
        [COMMON_FIELDS.TASK.DUE_DATE]: dueDate ? formatDateForBigin(dueDate) : undefined,
        [COMMON_FIELDS.TASK.STATUS]: status,
        [COMMON_FIELDS.TASK.PRIORITY]: priority,
        [COMMON_FIELDS.TASK.DESCRIPTION]: description,
        [COMMON_FIELDS.TASK.RELATED_TO]: relatedTo
      });

      // Update task
      const response = await client.updateTask(taskId, taskData);

      return {
        success: true,
        data: response.data?.[0] || response,
        message: 'Task updated successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }
});
