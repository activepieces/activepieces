import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkTaskFields } from '../../common/task-fields';
import { folkOutputSchemas } from '../../output-schemas';

export const createTask = createAction({
  auth: folkAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a to-do task on a Folk person, company or object.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.task,
  aiMetadata: {
    description:
      'Creates a Folk task linked to a person (per_...), company (com_...) or object (obj_...), with a title and due date (YYYY-MM-DD), plus optional description, due time, repeat, assignees and visibility. Without assignees it goes to the API key owner. Each call adds a task; pass an Idempotency Key so a retry returns the first one. Returns the task with its ID.',
    idempotent: false,
  },
  props: {
    entityId: folkAi.idProp({ displayName: 'Record ID', description: 'ID of the person, company or object the task is about.' }),
    title: Property.ShortText({ displayName: 'Title', description: 'What needs doing.', required: true }),
    dueAt: Property.ShortText({ displayName: 'Due Date', description: 'Due date as YYYY-MM-DD.', required: true }),
    ...folkTaskFields.taskProps(),
    idempotencyKey: folkAi.idempotencyKeyProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const title = folkFields.textValue({ value: p.title });
    const dueAt = folkFields.dateValue({ value: p.dueAt, label: 'Due Date' });
    if (title === undefined || dueAt === undefined) {
      throw new Error('Title and Due Date are required.');
    }
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/tasks',
      body: {
        entity: folkTaskFields.entityRef({ value: p.entityId, label: 'Record ID' }),
        title,
        dueAt,
        ...folkTaskFields.commonBody({ props: p }),
      },
      idempotencyKey: folkFields.idempotencyKeyValue({ value: p.idempotencyKey }),
    });
  },
});
