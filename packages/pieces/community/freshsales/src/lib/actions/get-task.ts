import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { taskOutputSchema } from '../output-schemas';

export const getTask = createAction({
  auth: freshsalesAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Get a task by its ID',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Freshsales task by numeric ID, including title, due date, status (0 open, 1 done), owner and the linked record. Fails with a not-found error if the ID does not exist. Use List Tasks to find task IDs.',
    idempotent: true,
  },
  outputSchema: taskOutputSchema,
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'ID of the task to fetch',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.task_id, field: 'Task ID' });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/tasks/${id}`,
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'task' })
    );
  },
});
