import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkTaskFields } from '../../common/task-fields';
import { folkOutputSchemas } from '../../output-schemas';

export const updateTask = createAction({
  auth: folkAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Change a Folk task, or mark it done or to do.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.task,
  aiMetadata: {
    description:
      'Updates a Folk task by ID. Only fields you give change. Status "done" marks it completed now (or at Completed At); "todo" reopens it. Assignees replace the current assignees. Clear Due Time and Clear Description empty those fields. Returns the task after all changes.',
    idempotent: false,
  },
  props: {
    taskId: folkAi.idProp({ displayName: 'Task ID', description: 'ID of the task to update.' }),
    title: Property.ShortText({ displayName: 'Title', description: 'New title.', required: false }),
    dueAt: Property.ShortText({ displayName: 'Due Date', description: 'New due date, YYYY-MM-DD.', required: false }),
    entityId: folkAi.idProp({ displayName: 'Record ID', description: 'Move the task to this person, company or object.', required: false }),
    ...folkTaskFields.taskProps(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'done completes the task; todo reopens it. Empty keeps it.',
      required: false,
      options: {
        options: [
          { label: 'Done', value: 'done' },
          { label: 'To do', value: 'todo' },
        ],
      },
    }),
    completedAt: Property.ShortText({
      displayName: 'Completed At',
      description: 'With Status done: completion time (ISO). Defaults to now.',
      required: false,
    }),
    clearDueTime: Property.Checkbox({ displayName: 'Clear Due Time', description: 'Remove the due time.', required: false }),
    clearDescription: Property.Checkbox({ displayName: 'Clear Description', description: 'Remove the description.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const path = `/v1/tasks/${folkClient.idSegment({ value: p.taskId, label: 'Task ID' })}`;
    const title = folkFields.textValue({ value: p.title });
    const dueAt = folkFields.dateValue({ value: p.dueAt, label: 'Due Date' });
    const entity = folkFields.textValue({ value: p.entityId });
    const status = p.status === 'done' || p.status === 'todo' ? p.status : undefined;
    const completedAt = folkFields.dateTimeValue({ value: p.completedAt, label: 'Completed At' });
    if (completedAt !== undefined && status !== 'done') {
      throw new Error('Completed At only applies with Status done.');
    }
    const body: Record<string, unknown> = {
      ...folkTaskFields.commonBody({ props: p }),
      ...(title !== undefined ? { title } : {}),
      ...(dueAt !== undefined ? { dueAt } : {}),
      ...(entity !== undefined ? { entity: folkTaskFields.entityRef({ value: entity, label: 'Record ID' }) } : {}),
      ...(folkFields.isTrue({ value: p.clearDueTime }) ? { dueTime: null } : {}),
      ...(folkFields.isTrue({ value: p.clearDescription }) ? { description: null } : {}),
    };
    if (Object.keys(body).length === 0 && status === undefined) {
      throw new Error('Nothing to update. Give at least one field or a Status.');
    }
    const patched =
      Object.keys(body).length > 0
        ? await folkClient.sendData<Record<string, unknown>>({ auth: context.auth, method: HttpMethod.PATCH, path, body })
        : undefined;
    if (status === 'done') {
      return folkClient.sendData<Record<string, unknown>>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: `${path}/mark-as-done`,
        body: { completedAt: completedAt ?? new Date().toISOString() },
      });
    }
    if (status === 'todo') {
      return folkClient.sendData<Record<string, unknown>>({ auth: context.auth, method: HttpMethod.POST, path: `${path}/mark-as-todo`, body: {} });
    }
    return patched;
  },
});
