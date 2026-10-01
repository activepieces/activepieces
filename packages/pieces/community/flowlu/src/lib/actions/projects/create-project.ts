import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluAiBody } from '../../common/ai-props';
import { flowluProjectProps } from '../../common/project-props';
import { flowluOutput } from '../../common/utils';
import { projectCreateOutputSchema } from '../../output-schemas';

export const createProjectAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Creates a new project.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new Flowlu project with a manager, customer, dates and template picked from lists. For agents use flowlu_project_create. Not idempotent: each call creates a new project.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    project_type_id: flowluCommon.project_template_id(false),
    ...flowluProjectProps.fields(),
  },
  outputSchema: projectCreateOutputSchema,
  async run(context) {
    const client = makeClient(context.auth);
    const created = await client.createRecord(
      'st',
      'projects',
      flowluAiBody.project(context.propsValue)
    );
    return flowluOutput.fullRecord({
      client,
      module: 'st',
      entity: 'projects',
      created,
    });
  },
});
