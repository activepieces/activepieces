import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaCommon } from '../common';

export const getMeetingTranscription = createAction({
  name: 'get_meeting_transcription',
  displayName: 'Get Meeting Transcription',
  description: 'Returns a single transcription for a given meeting with speakers and timestamps',
  props: {
    manual_uuid: avomaCommon.transcriptionUuidProperty,
    uuid: avomaCommon.transcriptionDropdown
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Use manual UUID if provided, otherwise use dropdown selection
    const transcriptionUuid = propsValue.manual_uuid || propsValue.uuid;
    
    if (!transcriptionUuid) {
      throw new Error('Please provide a transcription UUID either manually or by selecting from the dropdown');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.avoma.com/v1/transcriptions/${transcriptionUuid}/`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    return response.body;
  }
});