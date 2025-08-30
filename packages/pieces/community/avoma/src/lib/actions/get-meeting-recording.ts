import { createAction, Property } from '@activepieces/pieces-framework';
import { avomaAuth } from '../../index';
import { createAvomaClient } from '../common';

export const getMeetingRecordingAction = createAction({
  auth: avomaAuth,
  name: 'get_meeting_recording',
  displayName: 'Get Meeting Recording',
  description: 'Returns video and audio recording for a given meeting',
  props: {
    meetingId: Property.ShortText({
      displayName: 'Meeting ID',
      required: true,
      description: 'The UUID of the meeting',
    }),
  },
  async run(context) {
    const client = createAvomaClient(context.auth);
    
    try {
      const recording = await client.getMeetingRecording(context.propsValue.meetingId);
      return {
        success: true,
        recording,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recording',
      };
    }
  },
});