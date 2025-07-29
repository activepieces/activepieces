import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, taskIdProperty, hookProperty, silentProperty, dynamicRefTypeProperty, dynamicRefIdProperty, dynamicAppProperty, dynamicSpaceProperty } from '../common';

export const updateTaskAction = createAction({
  auth: podioAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Updates the task with the given attributes. Any attributes not specified will remain unchanged.',
  props: {
    taskId: taskIdProperty,
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
    dueTime: Property.DateTime({
      displayName: 'Due Time',
      description: 'The new due time for the task (in users timezone)',
      required: false,
    }),
    responsible: Property.Number({
      displayName: 'Responsible User ID',
      description: 'The user id of the responsible user',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      description: 'True if the task is private, False otherwise',
      required: false,
    }),
    appId: dynamicAppProperty,
    spaceId: dynamicSpaceProperty,
    refType: dynamicRefTypeProperty,
    refId: dynamicRefIdProperty,
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Boolean indicating if the task has been marked as completed / not completed',
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
      responsible, 
      private: isPrivate, 
      appId,
      spaceId,
      refType, 
      refId, 
      completed, 
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

    if (reminder && reminder['remind_delta'] !== undefined && typeof reminder['remind_delta'] !== 'number') {
      throw new Error('Reminder remind_delta must be a number representing minutes before due date.');
    }

    const body: any = {};

    if (text !== undefined) {
      if (typeof text !== 'string') {
        throw new Error('Text must be a string.');
      }
      body.text = text;
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        throw new Error('Description must be a string.');
      }
      body.description = description;
    }

    if (dueDate !== undefined) {
      body.due_date = dueDate;
    }

    if (dueTime !== undefined) {
      body.due_time = dueTime;
    }

    if (responsible !== undefined) {
      if (typeof responsible !== 'number') {
        throw new Error('Responsible user ID must be a number.');
      }
      body.responsible = responsible;
    }

    if (typeof isPrivate === 'boolean') {
      body.private = isPrivate;
    }

    if (refType) {
      body.ref_type = refType;
    }

    if (refId) {
      body.ref_id = refId;
    }

    if (typeof completed === 'boolean') {
      body.completed = completed;
    }

    if (labels && Array.isArray(labels) && labels.length > 0) {
      body.labels = labels;
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    if (reminder) {
      body.reminder = reminder;
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