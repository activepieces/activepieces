import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NIFTY_ACCESS_TYPE_OPTIONS, NIFTY_TASK_VIEW_OPTIONS, niftyOps } from '../common/operations';
import { projectOutputSchema } from '../output-schemas';

export const createProject = createAction({
  auth: niftyAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Nifty project, optionally in a portfolio picked from a dropdown (agents: use nifty_project_create). Not idempotent: each call creates another project.',
    idempotent: false,
  },
  props: {
    portfolio: niftyProps.portfolio({
      required: false,
      description: 'Optional. When empty, Nifty uses your default portfolio.',
    }),
    name: Property.ShortText({ displayName: 'Project Name', description: 'Up to 100 characters.', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    access_type: Property.StaticDropdown({
      displayName: 'Access Type',
      required: false,
      options: { options: NIFTY_ACCESS_TYPE_OPTIONS },
    }),
    default_tasks_view: Property.StaticDropdown({
      displayName: 'Default Tasks View',
      required: false,
      options: { options: NIFTY_TASK_VIEW_OPTIONS },
    }),
  },
  outputSchema: projectOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return niftyOps.createProject({
      auth: context.auth,
      input: {
        name: p.name,
        portfolioId: p.portfolio,
        description: p.description,
        accessType: p.access_type,
        defaultTasksView: p.default_tasks_view,
      },
    });
  },
});
