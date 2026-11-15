import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluInput } from '../../common/utils';
import { projectOutputSchema } from '../../output-schemas';

export const getProjectAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Gets a project by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Flowlu project (name, manager, customer, dates, priority, archive state, planned revenue/expenses) by its numeric project_id. Use to read a project before updating it; use flowlu_find_projects to look projects up by name. Fails if it does not exist. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'Numeric project ID, such as "42". Map it from an earlier step or from Find Projects.',
      required: true,
    }),
  },
  outputSchema: projectOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.project_id,
      name: 'Project ID',
    });
    return makeClient(context.auth).getRecord('st', 'projects', id);
  },
});
