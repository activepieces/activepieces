import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluProps } from '../../common/props';
import { flowluTaskWire } from '../../common/task-wire';
import { taskEnvelopeOutputSchema } from '../../output-schemas';

export const createTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a new task.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new task in Flowlu, requiring a name and optionally setting priority, start/deadline dates, assignee (responsible/owner), type, task workflow stage, project and CRM account. Use to add a to-do or assignment. Not idempotent — each call creates a new task. For agents use flowlu_task_create.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    ...flowluProps.task,
  },
  outputSchema: taskEnvelopeOutputSchema,
  async run(context) {
    const client = makeClient(context.auth);
    return await client.createTask({
      ...flowluTaskWire.fields(context.propsValue),
      type: context.propsValue.type,
    });
  },
});
