import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateTimelineEventOutputSchema } from '../../output-schemas';

export const updateTimelineEventAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_timeline_event',
  outputSchema: metabaseCreateTimelineEventOutputSchema,
  displayName: 'Update Timeline Event',
  description: 'Change, move or archive a timeline event.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a timeline event, including moving it to another timeline. Archived = Yes hides it (recoverable).',
    idempotent: true,
  },
  props: {
    eventId: metabaseAiProps.timelineEventId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    timestamp: Property.DateTime({
      displayName: 'Timestamp',
      description: 'New time, ISO 8601. Empty = unchanged.',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'New IANA time zone. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    timelineId: metabaseAiProps.timelineId({
      required: false,
      description: 'Move the event to this timeline. Empty = unchanged.',
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description: 'Yes archives the event, No restores it. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateTimelineEvent({
      auth,
      eventId: propsValue.eventId,
      body: {
        name: propsValue.name,
        timestamp: propsValue.timestamp,
        timezone: propsValue.timezone,
        description: propsValue.description,
        timeline_id: propsValue.timelineId,
        archived: propsValue.archived,
      },
    });
  },
});
