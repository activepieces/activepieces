import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { flowluOutput } from '../../common/utils';
import { taskCreateOutputSchema } from '../../output-schemas';

export const flowluTaskCreate = createAction({
  auth: flowluAuth,
  name: 'flowlu_task_create',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task in Flowlu.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Flowlu task with a name and optional description, priority, dates, assignee, owner, workflow status, and links to a project (project_id), CRM account or parent task. Use to add a to-do; link it to a project by passing project_id from flowlu_find_projects. Not idempotent: each call creates a new task, so check flowlu_find_tasks first to avoid duplicates.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Task name, up to 255 characters.',
      required: true,
    }),
    ...flowluAiProps.task(),
  },
  outputSchema: taskCreateOutputSchema,
  async run(context) {
    const body = flowluAiBody.task(context.propsValue);
    const client = makeClient(context.auth);
    const created = await client.createRecord('task', 'tasks', body);
    return flowluOutput.fullRecord({
      client,
      module: 'task',
      entity: 'tasks',
      created,
    });
  },
});
