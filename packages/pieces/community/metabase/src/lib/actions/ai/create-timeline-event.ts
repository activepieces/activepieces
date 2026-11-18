import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateTimelineEventOutputSchema } from '../../output-schemas';

export const createTimelineEventAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_timeline_event',
  outputSchema: metabaseCreateTimelineEventOutputSchema,
  displayName: 'Create Timeline Event',
  description: 'Add an event to a timeline.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an event (e.g. a launch or outage) to a timeline so it shows on time-series charts. Each call creates a new event.',
    idempotent: false,
  },
  props: {
    timelineId: metabaseAiProps.timelineId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    timestamp: Property.DateTime({
      displayName: 'Timestamp',
      description:
        'When the event happened, ISO 8601, e.g. 2026-05-01T09:00:00Z.',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'IANA time zone of the timestamp, e.g. Europe/Berlin. Defaults to UTC.',
      required: false,
    }),
    timeMatters: Property.Checkbox({
      displayName: 'Time Matters',
      description: 'Show the time of day, not just the date.',
      required: false,
      defaultValue: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    icon: Property.StaticDropdown({
      displayName: 'Icon',
      description: 'Icon shown on charts. Empty = default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Star', value: 'star' },
          { label: 'Cake', value: 'cake' },
          { label: 'Mail', value: 'mail' },
          { label: 'Warning', value: 'warning' },
          { label: 'Bell', value: 'bell' },
          { label: 'Cloud', value: 'cloud' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createTimelineEvent({
      auth,
      body: {
        timeline_id: propsValue.timelineId,
        name: propsValue.name,
        timestamp: propsValue.timestamp,
        timezone: propsValue.timezone ?? 'UTC',
        time_matters: propsValue.timeMatters ?? false,
        description: propsValue.description,
        icon: propsValue.icon,
      },
    });
  },
});
