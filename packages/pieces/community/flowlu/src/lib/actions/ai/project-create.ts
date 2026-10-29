import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { flowluOutput } from '../../common/utils';
import { projectCreateOutputSchema } from '../../output-schemas';

export const flowluProjectCreate = createAction({
  auth: flowluAuth,
  name: 'flowlu_project_create',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Creates a project in Flowlu.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Flowlu project with a name and optional manager, CRM customer (organization and contact), source opportunity, dates, priority, template, portfolio, task workflow and planned revenue/expenses. Use when work for a client or deal needs its own project; add tasks to it afterwards with flowlu_task_create and project_id. Not idempotent: each call creates a new project.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Project name, such as "Acme website relaunch".',
      required: true,
    }),
    ...flowluAiProps.project(),
    project_type_id: Property.ShortText({
      displayName: 'Template ID',
      description:
        'Project template to start from. Numeric ID from flowlu_list_lookup_values with entity project_templates.',
      required: false,
    }),
  },
  outputSchema: projectCreateOutputSchema,
  async run(context) {
    const body = flowluAiBody.project(context.propsValue);
    const client = makeClient(context.auth);
    const created = await client.createRecord('st', 'projects', body);
    return flowluOutput.fullRecord({
      client,
      module: 'st',
      entity: 'projects',
      created,
    });
  },
});
