import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicTaskProperty, hookProperty, silentProperty, dynamicRefTypeProperty, dynamicRefIdProperty, dynamicAppProperty, dynamicSpaceProperty, dynamicOrgProperty } from '../common';

export const updateTaskAction = createAction({
  auth: podioAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Modify an existing task\'s details or status. Only specified fields will be updated.',
  props: {
    taskId: dynamicTaskProperty,
    text: Property.LongText({
      displayName: 'Text',
      description: 'The updated text (title) for the task',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The updated description for the task',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'The new due date for the task (in users timezone)',
      required: false,
    }),
    dueTime: Property.ShortText({
      displayName: 'Due Time',
      description: 'The new due time for the task in local timezone (HH:MM:SS format, e.g., "14:30:00")',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      description: 'Whether the task should be private (only creator, assignee and assignor can see it)',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Mark the task as completed or not completed',
      required: false,
    }),

    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
    appId: dynamicAppProperty,
    
    refType: dynamicRefTypeProperty,
    refId: dynamicRefIdProperty,

    responsible: Property.Number({
      displayName: 'Responsible User ID',
      description: 'The user ID of the person responsible for this task',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'The labels for the task. Either a list of label ids or label texts',
      required: false,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'The list of files that should be attached to the task',
      required: false,
    }),
    reminder: Property.Object({
      displayName: 'Reminder',
      description: 'Optional reminder on this task. Format: {"remind_delta": minutes_before_due_date}. If empty, existing reminder is deleted.',
      required: false,
    }),
    hook: hookProperty,
    silent: silentProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { 
      taskId,
      text, 
      description, 
      dueDate, 
      dueTime, 
      private: isPrivate,
      completed,
      orgId,
      spaceId,
      appId,
      refType, 
      refId, 
      responsible, 
      labels, 
      fileIds, 
      reminder, 
      hook, 
      silent 
    } = context.propsValue;

    if (!taskId) {
      throw new Error('Task ID is required to update a task. Please provide a valid task ID.');
    }

    if (refType && !refId) {
      throw new Error('Reference Object is required when Reference Type is specified. Please select an object from the dropdown.');
    }

    if (!refType && refId) {
      throw new Error('Reference Type is required when Reference Object is specified. Please select a reference type first.');
    }

    if (refType === 'item' && !appId) {
      throw new Error('App selection is required when referencing items. Please select an app first.');
    }

    if ((refType === 'status' || refType === 'task') && !spaceId) {
      throw new Error('Space selection is required when referencing status updates or tasks. Please select a space first.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (labels && !Array.isArray(labels)) {
      throw new Error('Labels must be provided as an array of strings or numbers.');
    }

    if (reminder && typeof reminder === 'object' && reminder['remind_delta'] !== undefined) {
      if (typeof reminder['remind_delta'] !== 'number' && reminder['remind_delta'] !== null) {
        throw new Error('Reminder remind_delta must be a number (minutes before due date) or null to delete existing reminder.');
      }
    }

    const body: any = {};
    let updateCount = 0;

    if (text !== undefined) {
      if (typeof text !== 'string') {
        throw new Error('Text must be a string.');
      }
      body.text = text;
      updateCount++;
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        throw new Error('Description must be a string.');
      }
      body.description = description;
      updateCount++;
    }

    if (dueDate !== undefined) {
      body.due_date = dueDate;
      updateCount++;
    }

    if (dueTime !== undefined) {
      body.due_time = dueTime;
      updateCount++;
    }

    if (typeof isPrivate === 'boolean') {
      body.private = isPrivate;
      updateCount++;
    }

    if (typeof completed === 'boolean') {
      body.completed = completed;
      updateCount++;
    }

    if (refType) {
      body.ref_type = refType;
      updateCount++;
    }

    if (refId) {
      body.ref_id = refId;
      updateCount++;
    }

    if (responsible !== undefined) {
      if (typeof responsible !== 'number') {
        throw new Error('Responsible user ID must be a number.');
      }
      body.responsible = responsible;
      updateCount++;
    }

    if (labels && Array.isArray(labels) && labels.length > 0) {
      body.labels = labels.filter((label: unknown) => 
        (typeof label === 'string' && label.trim().length > 0) || 
        typeof label === 'number'
      );
      updateCount++;
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds.filter((id: unknown) => 
        typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))
      );
      updateCount++;
    }

    if (reminder && typeof reminder === 'object') {
      if (reminder['remind_delta'] === null || reminder['remind_delta'] === '') {
        body.reminder = { remind_delta: null };
        updateCount++;
      } else if (typeof reminder['remind_delta'] === 'number') {
        body.reminder = reminder;
        updateCount++;
      }
    }

    if (updateCount === 0) {
      throw new Error('At least one field must be provided to update the task. Please specify which fields you want to modify.');
    }

    const queryParams: any = {};
    if (typeof hook === 'boolean') {
      queryParams.hook = hook.toString();
    }
    if (typeof silent === 'boolean') {
      queryParams.silent = silent.toString();
    }

    const response = await podioApiCall<{
      task_id: number;
      [key: string]: any;
    }>({
      method: HttpMethod.PUT,
      accessToken,
      resourceUri: `/task/${taskId}`,
      body,
      queryParams,
    });

    return response;
  },
}); 