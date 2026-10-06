import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { niftyOps } from '../common/operations';
import { milestoneOutputSchema } from '../output-schemas';

export const createMilestone = createAction({
  auth: niftyAuth,
  name: 'create_milestone',
  displayName: 'Create Milestone',
  description: 'Create a dated milestone, or a plain task list, in a project.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a milestone (needs start and end dates) or a plain task list in a Nifty project picked from a dropdown (agents: use nifty_milestone_create). Not idempotent: each call creates another milestone.',
    idempotent: false,
  },
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({ required: true }),
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
        projectId: p.project,
        name: p.name,
        description: p.description,
        start: p.start_date,
        end: p.end_date,
        createAsList: p.create_as_list,
      },
    });
  },
});
