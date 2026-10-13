import {
  createAction,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyProps } from '../common/props';
import { milestoneOutputSchema } from '../common/output-schemas';

export const createMilestone = createAction({
  auth: ninetyAuth,
  name: 'create_milestone',
  classification: 'WRITE',
  displayName: 'Create Milestone',
  description: 'Add a milestone step to an existing rock',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one milestone under a Ninety rock, the smaller step a quarterly goal is broken into. It needs the parent rock and its team, so create the rock first. Ninety always creates a milestone as not done, so there is no way to record a completed one here. Each call creates a new milestone, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: milestoneOutputSchema,
  props: {
    teamId: ninetyProps.teamIdRequired,
    rockId: ninetyProps.rockId,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The step this milestone represents',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const milestone = await ninetyCommon.createMilestone({
      token: auth.secret_text,
      milestone: {
        rockId: propsValue.rockId,
        teamId: propsValue.teamId,
        title: propsValue.title,
        dueDate: ninetyCommon.toIsoDate({
          value: propsValue.dueDate,
          field: 'Due Date',
        }),
        ...spreadIfDefined('description', propsValue.description),
      },
    });
    return milestone;
  },
});
