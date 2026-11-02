import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const getTask = createAction({
  auth: closeAuth,
  name: 'get_task',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Get one task by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Close task by ID (task_...), including lead, assignee, text, due date and completion state. Use List Tasks to find IDs.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.task,
  props: {
    taskId: Property.ShortText({ displayName: 'Task ID', description: 'task_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = closeClient.closeId({ value: propsValue.taskId, label: 'Task ID', prefix: 'task' });
    const raw = await closeClient.request({ auth, method: HttpMethod.GET, path: `/task/${closeClient.pathId(id)}/` });
    return closeMappers.task(raw);
  },
});

export { getTask };
