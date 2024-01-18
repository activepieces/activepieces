import {
  PiecePropValueSchema, Property,
  createAction,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { flowluAuth } from '../../../';
import { makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const createTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_task',
  displayName: 'Create Task',
  description: 'Creates a new task.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    ...flowluProps.task,
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.createTask({
      name: context.propsValue.name,
      description: context.propsValue.description,
      priority: context.propsValue.priority,
      plan_start_date: context.propsValue.plan_start_date
        ? dayjs(context.propsValue.plan_start_date).format(
          'YYYY-MM-DD HH:mm:ss'
        )
        : undefined,
      deadline: context.propsValue.deadline
        ? dayjs(context.propsValue.deadline).format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      deadline_allowchange: context.propsValue.deadline_allowchange ? 1 : 0,
      task_checkbyowner: context.propsValue.task_checkbyowner ? 1 : 0,
      responsible_id: context.propsValue.responsible_id,
      owner_id: context.propsValue.owner_id,
      type: context.propsValue.type,
      workflow_id: context.propsValue.workflow_id,
      workflow_stage_id: context.propsValue.workflow_stage_id,
    });
  },
});
