import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetTimelineOutputSchema } from '../../output-schemas';

export const getTimelineAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_timeline',
  outputSchema: metabaseGetTimelineOutputSchema,
  displayName: 'Get Timeline',
  description: 'Get a timeline, optionally with its events.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one timeline, optionally with its events (each with an id for the event actions).',
    idempotent: true,
  },
  props: {
    timelineId: metabaseAiProps.timelineId({ required: true }),
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
    return await metabaseApi.getTimeline({
      auth,
      timelineId: propsValue.timelineId,
      include: propsValue.includeEvents ? 'events' : undefined,
      archived: propsValue.archived ?? false,
    });
  },
});
