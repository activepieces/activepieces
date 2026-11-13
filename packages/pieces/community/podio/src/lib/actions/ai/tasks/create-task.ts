import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateTaskOutputSchema } from '../../../output-schemas';

export const createTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_create_task',
  outputSchema: podioCreateTaskOutputSchema,
  displayName: 'Create Task',
  description: 'Creates a task, standalone or linked to an item, status or other object.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates one Podio task, standalone or linked to an object given by Reference Type and Reference ID together (an item id from the item actions, a status id from Create Status). Each call creates a new task. User ids come from List Space Members, label ids from List Task Labels, file ids from Upload File.',
    idempotent: false,
  },
  props: {
    text: podioAiProps.text({ required: true, displayName: 'Text', description: 'The title of the task.' }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'The description of the task.' }),
    refType: podioAiProps.text({ required: false, displayName: 'Reference Type', description: 'The type of object to link the task to, such as "item", "status", "app" or "space". Requires Reference ID.' }),
    refId: podioAiProps.id({ required: false, displayName: 'Reference ID', description: 'The id of the object to link the task to. Requires Reference Type.' }),
    responsible: podioAiProps.idList({ required: false, displayName: 'Responsible User IDs', description: 'User ids of the people responsible for the task.' }),
    private: podioAiProps.bool({ required: false, displayName: 'Private', description: '"true" makes the task visible only to its creator and responsible users.' }),
    dueOn: podioAiProps.text({ required: false, displayName: 'Due On (UTC)', description: 'The due date and time in UTC, as "YYYY-MM-DD HH:MM:SS". Alternative to Due Date and Due Time.' }),
    dueDate: podioAiProps.text({ required: false, displayName: 'Due Date', description: 'The due date in local time, as "YYYY-MM-DD".' }),
    dueTime: podioAiProps.text({ required: false, displayName: 'Due Time', description: 'The due time in local time, as "HH:MM:SS".' }),
    labelIds: podioAiProps.idList({ required: false, displayName: 'Label IDs', description: 'Ids of existing labels to put on the task.' }),
    labels: podioAiProps.idList({ required: false, displayName: 'Label Names', description: 'Names of labels to put on the task.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of uploaded files to attach.' }),
    remindDelta: podioAiProps.number({ required: false, displayName: 'Reminder (Minutes Before Due)', description: 'Remind this many minutes before the due date.' }),
    recurrence: podioAiProps.json({ required: false, displayName: 'Recurrence', description: 'Repeat settings: {"name": "weekly"|"monthly"|"yearly", "config": {"days": ["monday"]} or {"repeat_on": "day_of_month"}, "step": 1, "until": "YYYY-MM-DD"}.' }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'An id for the task from another system.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { text, description, refType, refId, responsible, dueOn, dueDate, dueTime, labelIds, labels, fileIds, remindDelta, recurrence, externalId } = propsValue;
    if (Boolean(refType) !== Boolean(refId)) {
      throw new Error('Set Reference Type and Reference ID together, or neither.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: refType && refId ? `/task/${refType}/${refId}/` : '/task/',
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
      body: podioUtils.body({
        values: {
          text,
          description: description || undefined,
          private: podioUtils.toBool({ value: propsValue.private }),
          due_on: dueOn || undefined,
          due_date: dueDate || undefined,
          due_time: dueTime || undefined,
          responsible: responsible?.length ? responsible.map(Number) : undefined,
          label_ids: labelIds?.length ? labelIds.map(Number) : undefined,
          labels: labels?.length ? labels : undefined,
          file_ids: fileIds?.length ? fileIds.map(Number) : undefined,
          reminder: remindDelta === undefined || remindDelta === null ? undefined : { remind_delta: remindDelta },
          recurrence: recurrence ?? undefined,
          external_id: externalId || undefined,
        },
      }),
    });
  },
});
