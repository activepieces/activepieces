import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListTimelinesOutputSchema } from '../../output-schemas';

export const listTimelinesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_timelines',
  outputSchema: metabaseListTimelinesOutputSchema,
  displayName: 'List Timelines',
  description: 'List event timelines.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists event timelines (the annotations shown on time-series charts), optionally with their events.',
    idempotent: true,
  },
  props: {
    includeEvents: Property.Checkbox({
      displayName: 'Include Events',
      description: "Also return each timeline's events.",
      required: false,
      defaultValue: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Return archived items instead of active ones.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const timelines = await metabaseApi.listTimelines({
      auth,
      include: propsValue.includeEvents ? 'events' : undefined,
      archived: propsValue.archived ?? false,
    });
    return { timelines, count: timelines.length };
  },
});
