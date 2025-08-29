import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMeetingTranscription = createAction({
  name: 'get_meeting_transcription',
  displayName: 'Get Meeting Transcription',
  description: 'Returns a single transcription for a given meeting with speakers and timestamps',
  props: {
    uuid: Property.ShortText({
      displayName: 'Transcription UUID',
      description: 'Unique ID of the transcription (UUID format)',
      required: true
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.avoma.com/v1/transcriptions/${propsValue.uuid}/`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    return response.body;
  }
});