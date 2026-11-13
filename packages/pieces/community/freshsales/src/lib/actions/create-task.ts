import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { freshsalesProps } from '../common/props';
import { taskOutputSchema } from '../output-schemas';

export const createTask = createAction({
  auth: freshsalesAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a task linked to a contact, account or deal',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Freshsales task linked to a contact, account or deal (Related To + Related Record ID) with a due date and owner. Returns the task with its ID. Not idempotent: each call creates a new task.',
    idempotent: false,
  },
  outputSchema: taskOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the task',
      placeholder: 'Follow up on proposal',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Details of the task',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due',
      required: true,
    }),
    owner_id: freshsalesProps.owner({ required: true, description: 'User the task is assigned to' }),
    targetable_type: freshsalesProps.targetableType({ required: true }),
    targetable_id: freshsalesProps.targetableId({ required: true }),
  },
  async run(context) {
    const task = freshsalesClient.pickDefined({
      title: context.propsValue.title,
      description: context.propsValue.description,
      due_date: freshsalesClient.toIsoDate(context.propsValue.due_date),
      owner_id: freshsalesClient.requireId({ value: context.propsValue.owner_id, field: 'Owner' }),
      targetable_type: context.propsValue.targetable_type,
      targetable_id: freshsalesClient.requireId({
        value: context.propsValue.targetable_id,
        field: 'Related Record ID',
      }),
    });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/tasks',
      body: { task },
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'task' })
    );
  },
});
