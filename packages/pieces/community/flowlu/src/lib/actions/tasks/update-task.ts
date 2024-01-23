import {
  PiecePropValueSchema, Property,
  createAction,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { flowluAuth } from '../../../';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const updateTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_task',
  displayName: 'Update Task',
  description: 'Updates an existing task.',
  props: {
    task_id: flowluCommon.task_id(true),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    ...flowluProps.task,
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
        : undefined,
      deadline: context.propsValue.deadline
        ? dayjs(context.propsValue.deadline).format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      deadline_allowchange: context.propsValue.deadline_allowchange ? 1 : 0,
      task_checkbyowner: context.propsValue.task_checkbyowner ? 1 : 0,
      type: context.propsValue.type,
      responsible_id: context.propsValue.responsible_id,
      owner_id: context.propsValue.owner_id,
      workflow_id: context.propsValue.workflow_id,
      workflow_stage_id: context.propsValue.workflow_stage_id,
    });
  },
});
