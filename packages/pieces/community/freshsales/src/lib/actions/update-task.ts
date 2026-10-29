import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { freshsalesProps } from '../common/props';
import { taskOutputSchema } from '../output-schemas';

export const updateTask = createAction({
  auth: freshsalesAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Update a task or mark it completed',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an existing Freshsales task by numeric ID; set Status to Completed to close it. Only the fields you provide are changed. Idempotent: repeating the call with the same values gives the same result.',
    idempotent: true,
  },
  outputSchema: taskOutputSchema,
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'ID of the task to update',
      placeholder: '16000123456',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title of the task',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New details of the task',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'New due date',
      required: false,
    }),
    owner_id: freshsalesProps.owner({ required: false, description: 'User the task is assigned to' }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Open or completed',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: '0' },
          { label: 'Completed', value: '1' },
        ],
      },
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.task_id, field: 'Task ID' });
    const status = context.propsValue.status;
    if (status !== undefined && status !== null && status !== '0' && status !== '1') {
      throw new Error('Status must be 0 (open) or 1 (completed).');
    }
    const task = freshsalesClient.pickDefined({
      title: context.propsValue.title,
      description: context.propsValue.description,
      due_date: freshsalesClient.toIsoDate(context.propsValue.due_date),
      owner_id: freshsalesClient.toId({ value: context.propsValue.owner_id, field: 'Owner' }),
      status: status === undefined || status === null ? undefined : Number(status),
    });
    if (Object.keys(task).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/api/tasks/${id}`,
      body: { task },
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'task' })
    );
  },
});
