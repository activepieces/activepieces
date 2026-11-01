import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps } from '../../common/props';
import { flowluTaskWire } from '../../common/task-wire';
import { flowluInput } from '../../common/utils';
import { taskEnvelopeOutputSchema } from '../../output-schemas';

export const updateTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Updates an existing task.',
  audience: 'human',
  aiMetadata: {
    description:
      "Updates fields on an existing task in Flowlu, identified by its task id. Use to change a task's name, priority, dates, assignee, status, project, or workflow stage, or to change its type to Inbox, Event or Task template (choosing Task keeps the current type). Empty fields are not sent; the two approval/deadline checkboxes are always sent. The task id is required and must reference an existing task. Idempotent: repeating the same update leaves the task unchanged. For agents use flowlu_task_update.",
    idempotent: true,
  },
  props: {
    task_id: flowluCommon.task_id(true),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    ...flowluProps.task,
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New task status. Leave empty to keep the current status.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'New', value: 1 },
          { label: 'In progress', value: 3 },
          { label: 'Pending owner approval', value: 4 },
          { label: 'Completed', value: 5 },
        ],
      },
    }),
  },
  outputSchema: taskEnvelopeOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const id = flowluInput.requireId({ value: props.task_id, name: 'Task ID' });
    const client = makeClient(context.auth);
    return await client.updateTask(id, {
      ...flowluTaskWire.fields(props),
      type: props.type === 0 ? undefined : props.type,
      status: props.status,
    });
  },
});
