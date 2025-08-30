import { createAction, Property } from '@activepieces/pieces-framework';
import { avomaAuth } from '../../index';
import { createAvomaClient } from '../common';

export const getMeetingTranscriptionAction = createAction({
  auth: avomaAuth,
  name: 'get_meeting_transcription',
  displayName: 'Get Meeting Transcription',
  description: 'Returns transcription for a given meeting',
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
      const transcription = await client.getMeetingTranscription(context.propsValue.meetingId);
      return {
        success: true,
        transcription,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transcription',
      };
    }
  },
});