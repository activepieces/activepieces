import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaCommon } from '../common';

export const getMeetingRecording = createAction({
  name: 'get_meeting_recording',
  displayName: 'Get Meeting Recording',
  description: 'Returns video and audio recording URLs for a given meeting',
  props: {
    meeting_uuid: avomaCommon.meetingDropdown
  },
  async run(context) {
    const { auth, propsValue } = context;

    const meetingUuid = propsValue.meeting_uuid;

    if (!meetingUuid) {
      throw new Error('Please select a meeting from the dropdown');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.avoma.com/v1/recordings/?meeting_uuid=${meetingUuid}`,
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        return {
          success: true,
          status: 'available',
          meeting_uuid: response.body.meeting_uuid,
          recording_uuid: response.body.uuid,
          audio_url: response.body.audio_url,
          video_url: response.body.video_url,
          valid_till: response.body.valid_till,
          urls_expire_in_days: 5
        };
      } else if (response.status === 202) {
        return {
          success: true,
          status: 'processing',
          meeting_uuid: response.body.meeting_uuid,
          recording_uuid: response.body.uuid,
          message: response.body.message || 'Recording is being processed and not yet available',
          note: 'Check audio_ready and video_ready parameters in the meeting details to verify recording status'
        };
      } else if (response.status === 403) {
        throw new Error(`Permission denied: ${response.body.detail || 'You do not have permission to access this recording'}`);
      } else if (response.status === 404) {
        throw new Error(`Recording not found: ${response.body.detail || 'No recording exists for this meeting'}`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${response.body.detail || 'Too many requests. Please try again later'}`);
      } else if (response.status >= 400) {
        throw new Error(`API error (${response.status}): ${JSON.stringify(response.body) || 'Unknown error'}`);
      }

      return {
        success: false,
        status: 'unknown',
        meeting_uuid: meetingUuid,
        error: 'Unexpected response from API'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to retrieve meeting recording for UUID ${meetingUuid}: ${errorMessage}`);
    }
  }
});