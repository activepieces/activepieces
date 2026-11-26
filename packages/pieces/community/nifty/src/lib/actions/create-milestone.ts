import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
  propertyGroups: [
    { key: 'location', display: 'section', label: 'Location', icon: 'inbox', props: ['portfolio', 'project'] },
    { key: 'details', display: 'section', label: 'Milestone', icon: 'text', props: ['name', 'description'] },
    { key: 'schedule', display: 'section', label: 'Schedule', icon: 'calendar', props: ['create_as_list', 'dates_info', 'start_date', 'end_date'] },
  ],
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({ required: true }),
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    start_date: Property.DateTime({ displayName: 'Start Date', required: false, width: 'half' }),
    end_date: Property.DateTime({ displayName: 'End Date', required: false, width: 'half' }),
    create_as_list: Property.Checkbox({
      displayName: 'Create as List',
      description: 'Creates a plain task list instead of a milestone.',
      required: false,
      defaultValue: false,
    }),
    dates_info: Property.MarkDown({ value: 'A milestone needs both dates. A list needs none.', variant: MarkdownVariant.INFO }),
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
