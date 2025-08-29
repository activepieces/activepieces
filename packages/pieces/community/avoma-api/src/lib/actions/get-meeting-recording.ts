import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMeetingRecording = createAction({
  name: 'get_meeting_recording',
  displayName: 'Get Meeting Recording',
  description: 'Returns video and audio recording URLs for a given meeting',
  props: {
    meeting_uuid: Property.ShortText({
      displayName: 'Meeting UUID',
      description: 'Unique ID of the meeting (UUID format)',
      required: true
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.avoma.com/v1/meetings/${propsValue.meeting_uuid}/recording/`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    return response.body;
  }
});