import { createAction, Property } from '@activepieces/pieces-framework';
import { zoomMeetingDropdown } from '../common/props';
import { zoomMeetings } from '../common/meetings';
import { getMeetingOutputSchema } from '../output-schemas';
import { zoomAuth } from '../..';

export const zoomFindMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_find_meeting',
  classification: 'READ',
  displayName: 'Find Zoom Meeting',
  description: 'Retrieve the details of an existing meeting.',
  audience: 'human',
  aiMetadata: { description: 'Fetches the full details of an existing Zoom meeting by its meeting ID. Use to look up a meeting before acting on it; optionally target a specific occurrence of a recurring meeting or include all previous occurrences. Read-only and idempotent.', idempotent: true },
  outputSchema: getMeetingOutputSchema,
  props: {
    meeting_id: zoomMeetingDropdown,
    occurrence_id: Property.ShortText({
      displayName: 'Occurrence ID',
      description:
        'Meeting Occurrence ID. Provide this field to view meeting details of a particular occurrence of the recurring meeting.',
      required: false,
    }),
    show_previous_occurrences: Property.Checkbox({
      displayName: 'Show Previous Occurrences',
      description:
        'Set to true if you would like to view meeting details of all previous occurrences of a recurring meeting.',
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
