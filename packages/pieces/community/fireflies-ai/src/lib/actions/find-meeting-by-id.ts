import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAuth } from '../..';
import { fireflyService } from '../common/fireflyService';

export const findMeetingById = createAction({
  auth: firefliesAuth,
  name: 'findMeetingById',
  displayName: 'Find Meeting Transcript by ID',
  description: "Fetch a specific meeting's transcript and metadata by its ID",
  props: {
    meetingId: Property.ShortText({
      displayName: 'Meeting ID',
      description: 'The ID of the meeting transcript that you want to retrieve',
      required: true,
    }),
  },
  run({auth, propsValue}) {
    return fireflyService.getTranscript(auth, propsValue.meetingId as string);
  },
});