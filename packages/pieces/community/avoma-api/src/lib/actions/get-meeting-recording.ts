import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaCommon } from '../common';

export const getMeetingRecording = createAction({
  name: 'get_meeting_recording',
  displayName: 'Get Meeting Recording',
  description: 'Returns video and audio recording URLs for a given meeting',
  props: {
    manual_uuid: avomaCommon.meetingUuidProperty,
    meeting_uuid: avomaCommon.meetingDropdown
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Use manual UUID if provided, otherwise use dropdown selection
    const meetingUuid = propsValue.manual_uuid || propsValue.meeting_uuid;
    
    if (!meetingUuid) {
      throw new Error('Please provide a meeting UUID either manually or by selecting from the dropdown');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.avoma.com/v1/meetings/${meetingUuid}/recording/`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    return response.body;
  }
});