import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const updateTask = createAction({
  auth: closeAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Change, reassign or complete a task.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates a Close task (task_...). Only the fields you pass change: text, assignee (user_...), due date (YYYY-MM-DD or ISO 8601 date-time) and complete (true or false). Use complete=true to mark it done. Repeating the same update gives the same result.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.task,
  props: {
    taskId: Property.ShortText({ displayName: 'Task ID', description: 'task_...', required: true }),
    text: Property.LongText({ displayName: 'Text', required: false }),
    assignedTo: Property.ShortText({ displayName: 'Assigned To (user ID)', description: 'user_...', required: false }),
    date: Property.ShortText({ displayName: 'Due', description: 'YYYY-MM-DD or ISO 8601 date-time.', required: false }),
    isComplete: Property.ShortText({ displayName: 'Complete', description: 'true or false; leave empty to keep.', required: false }),
  },
  async run({ auth, propsValue }) {
    const taskId = closeClient.closeId({ value: propsValue.taskId, label: 'Task ID', prefix: 'task' });
    const fields = {
      text: closeClient.optionalText(propsValue.text),
      assigned_to: closeClient.optionalCloseId({ value: propsValue.assignedTo, label: 'Assigned To', prefix: 'user' }),
      date: closeClient.isoDate({ value: propsValue.date, label: 'Due' }),
      is_complete: closeClient.parseBoolean({ value: propsValue.isComplete, label: 'Complete' }),
    };
    const body = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (Object.keys(body).length === 0) throw new Error('Pass at least one field to update.');
    const raw = await closeClient.request({ auth, method: HttpMethod.PUT, path: `/task/${closeClient.pathId(taskId)}/`, body });
    return closeMappers.task(raw);
  },
});

export { updateTask };
