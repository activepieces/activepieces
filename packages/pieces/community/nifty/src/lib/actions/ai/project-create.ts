import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../../auth';
import { NIFTY_ACCESS_TYPE_OPTIONS, NIFTY_TASK_VIEW_OPTIONS, niftyOps } from '../../common/operations';
import { projectOutputSchema } from '../../output-schemas';

export const niftyProjectCreate = createAction({
  auth: niftyAuth,
  name: 'nifty_project_create',
  displayName: 'Create Project (AI)',
  description: 'Creates a project. Built for AI agents.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Nifty project, optionally in a given portfolio (otherwise the workspace default), with a description, access level (public, workspace or limited) and default task view (table, kanban, swimlane or timeline). Use when an agent must start a new project; requires name. Not idempotent: each call creates another project.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Up to 100 characters.', required: true }),
    portfolio_id: Property.ShortText({
      displayName: 'Portfolio ID',
      description: 'Optional. The portfolio field (subteam) of any existing project shows the ID.',
      required: false,
    }),
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
        portfolioId: p.portfolio_id,
        description: p.description,
        accessType: p.access_type,
        defaultTasksView: p.default_tasks_view,
      },
    });
  },
});
