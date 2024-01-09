import { flowluAuth } from '@activepieces/piece-flowlu';
import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluCommon, makeClient } from '../../common';

export const createTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_task',
  displayName: 'Create Task',
  description: 'Creates a new Task.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Discription',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Low',
            value: 1,
          },
          {
            label: 'Medium',
            value: 2,
          },
          {
            label: 'High',
            value: 3,
          },
        ],
      },
    }),
    plan_start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    plan_end_date: Property.DateTime({
      displayName: 'End Date',
      required: false,
    }),
    deadline_allowchange: Property.Checkbox({
      displayName: 'The assignee can change the end date for this task?',
      required: true,
      defaultValue: false,
    }),
    task_checkbyowner: Property.Checkbox({
      displayName: 'This task needs approval from the owner?',
      required: true,
      defaultValue: false,
    }),
    responsible_id: flowluCommon.user_id(false, 'Assignee ID'),
    owner_id: flowluCommon.user_id(false, 'Owner ID'),
    type: Property.StaticDropdown({
      displayName: 'Task Type',
      required: true,
      defaultValue: 0,
      options: {
        disabled: false,
        options: [
          {
            label: 'Task',
            value: 0,
          },
          {
            label: 'Inbox',
            value: 1,
          },
          {
            label: 'Event',
            value: 20,
          },
          {
            label: 'Task template',
            value: 30,
          },
        ],
      },
    }),
    workflow_id: flowluCommon.workflow_id(false),
    workflow_stage_id: flowluCommon.workflow_stage_id(false),
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.createTask(context.propsValue);
  },
});
