import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../../auth';
import { niftyOps } from '../../common/operations';
import { milestoneOutputSchema } from '../../output-schemas';

export const niftyMilestoneCreate = createAction({
  auth: niftyAuth,
  name: 'nifty_milestone_create',
  displayName: 'Create Milestone or List (AI)',
  description: 'Creates a milestone or task list from a project ID. Built for AI agents.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates either a dated milestone (shown on the project roadmap, needs start_date and end_date) or a plain task list (create_as_list true, dates optional) in a Nifty project. Use before creating tasks that should sit under a milestone; requires project_id and name. Not idempotent: each call creates another milestone or list.',
    idempotent: false,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    start_date: Property.DateTime({ displayName: 'Start Date', description: 'Required for a milestone.', required: false }),
    end_date: Property.DateTime({ displayName: 'End Date', description: 'Required for a milestone.', required: false }),
    create_as_list: Property.Checkbox({
      displayName: 'Create as List',
      description: 'Turn on to create a plain task list without dates instead of a milestone.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: milestoneOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return niftyOps.createMilestone({
      auth: context.auth,
      input: {
        projectId: p.project_id,
        name: p.name,
        description: p.description,
        start: p.start_date,
        end: p.end_date,
        createAsList: p.create_as_list,
      },
    });
  },
});
