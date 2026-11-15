import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateTaskOutputSchema } from '../../../output-schemas';

export const updateTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_update_task',
  outputSchema: podioCreateTaskOutputSchema,
  displayName: 'Update Task',
  description: 'Changes one or more fields of a task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the fields that are set on one Podio task and leaves the rest; set at least one. Labels and files given replace the current ones. Reference Type and Reference ID go together. The task id comes from List Tasks, List Object Tasks or Create Task; user ids from List Space Members; label ids from List Task Labels.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    text: podioAiProps.text({ required: false, displayName: 'Text', description: 'The new title of the task.' }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'The new description of the task.' }),
    dueDate: podioAiProps.text({ required: false, displayName: 'Due Date', description: 'The new due date in local time, as "YYYY-MM-DD".' }),
    dueTime: podioAiProps.text({ required: false, displayName: 'Due Time', description: 'The new due time in local time, as "HH:MM:SS".' }),
    responsibleUserId: podioAiProps.id({ required: false, displayName: 'Responsible User ID', description: 'The user id of the new responsible person.' }),
    private: podioAiProps.bool({ required: false, displayName: 'Private', description: '"true" makes the task private, "false" makes it visible.' }),
    completed: podioAiProps.bool({ required: false, displayName: 'Completed', description: '"true" marks the task completed, "false" reopens it.' }),
    refType: podioAiProps.text({ required: false, displayName: 'Reference Type', description: 'The type of object to link the task to, such as "item" or "status". Requires Reference ID.' }),
    refId: podioAiProps.id({ required: false, displayName: 'Reference ID', description: 'The id of the object to link the task to. Requires Reference Type.' }),
    labelIds: podioAiProps.idList({ required: false, displayName: 'Label IDs', description: 'Ids of the labels the task should have, replacing the current ones.' }),
    labelTexts: podioAiProps.idList({ required: false, displayName: 'Label Names', description: 'Names of the labels the task should have, replacing the current ones.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of the files the task should have, replacing the current ones.' }),
    remindDelta: podioAiProps.number({ required: false, displayName: 'Reminder (Minutes Before Due)', description: 'Remind this many minutes before the due date.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { taskId, text, description, dueDate, dueTime, responsibleUserId, refType, refId, labelIds = [], labelTexts = [], fileIds, remindDelta } = propsValue;
    if (Boolean(refType) !== Boolean(refId)) {
      throw new Error('Set Reference Type and Reference ID together, or neither.');
    }
    if (responsibleUserId && !/^\d+$/.test(responsibleUserId)) {
      throw new Error('Responsible User ID must be a numeric Podio user id.');
    }
    const labels = [...labelIds.map(Number), ...labelTexts];
    const body = podioUtils.body({
      values: {
        text: text || undefined,
        description: description || undefined,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        responsible: responsibleUserId ? Number(responsibleUserId) : undefined,
        private: podioUtils.toBool({ value: propsValue.private }),
        completed: podioUtils.toBool({ value: propsValue.completed }),
        ref_type: refType || undefined,
        ref_id: refId ? Number(refId) : undefined,
        labels: labels.length ? labels : undefined,
        file_ids: fileIds?.length ? fileIds.map(Number) : undefined,
        reminder: remindDelta === undefined || remindDelta === null ? undefined : { remind_delta: remindDelta },
      },
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to change.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/task/${taskId}`,
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
      body,
    });
  },
});
