import {
  PiecePropValueSchema, Property,
  createAction,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const createTaskAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_task',
  displayName: 'Create Task',
  description: 'Creates a new task.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new task in Flowlu, requiring a name and optionally setting priority, start/deadline dates, assignee (responsible/owner), type, and task workflow stage. Use to add a to-do or assignment. Not idempotent — each call creates a new task.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    ...flowluProps.task,
  },
  async run(context) {
    const client = makeClient(
      context.auth
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
