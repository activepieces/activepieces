import { createAction, Property } from '@activepieces/pieces-framework';
import { zoomAuth } from '../..';
import { zoomMeetings } from '../common/meetings';
import { zoomProps } from '../common/props';
import { getMeetingOutputSchema } from '../output-schemas';

export const zoomGetMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_get_meeting',
  displayName: 'Get Meeting',
  description: 'Get the details of a meeting by its meeting ID.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description: 'Fetches one Zoom meeting by its numeric meeting ID, optionally a specific occurrence of a recurring meeting. Use after List Meetings or Create Meeting to read the join URL, settings or start time. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getMeetingOutputSchema,
  props: {
    meeting_id: zoomProps.meetingId({ description: 'The numeric Zoom meeting ID, for example 85746065432.' }),
    occurrence_id: zoomProps.occurrenceId(),
    show_previous_occurrences: Property.Checkbox({
      displayName: 'Show Previous Occurrences',
      description: 'For recurring meetings: also include occurrences that already happened.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return zoomMeetings.getMeeting({
      accessToken: context.auth.access_token,
      meetingId: context.propsValue.meeting_id,
      occurrenceId: context.propsValue.occurrence_id,
      showPreviousOccurrences: context.propsValue.show_previous_occurrences,
    });
  },
});
