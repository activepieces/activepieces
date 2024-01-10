import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { flowluAuth } from '../../../';
import { flowluCommon, makeClient } from '../../common';

export const updateTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_task',
  displayName: 'Update Task',
  description: 'Updates an existing task.',
  props: {
    task_id: flowluCommon.task_id(true),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
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
    deadline: Property.DateTime({
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
    return await client.updateTask(context.propsValue.task_id!, {
      name: context.propsValue.name,
      description: context.propsValue.description,
      priority: context.propsValue.priority,
      plan_start_date: context.propsValue.plan_start_date
        ? dayjs(context.propsValue.plan_start_date).format(
            'YYYY-MM-DD HH:mm:ss'
          )
        : '',
      deadline: context.propsValue.deadline
        ? dayjs(context.propsValue.deadline).format('YYYY-MM-DD HH:mm:ss')
        : '',
      deadline_allowchange: context.propsValue.deadline_allowchange ? 1 : 0,
      task_checkbyowner: context.propsValue.task_checkbyowner ? 1 : 0,
      type: context.propsValue.type,
      workflow_id: context.propsValue.workflow_id,
      workflow_stage_id: context.propsValue.workflow_stage_id,
    });
  },
});
