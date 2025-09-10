import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaCommon } from '../common';

export const getMeetingTranscription = createAction({
  name: 'get_meeting_transcription',
  displayName: 'Get Meeting Transcription',
  description: 'Returns transcription with speakers, timestamps, and VTT file URL',
  props: {
    transcription_uuid: avomaCommon.transcriptionDropdown
  },
  async run(context) {
    const { auth, propsValue } = context;

    const transcriptionUuid = propsValue.transcription_uuid;

    if (!transcriptionUuid) {
      throw new Error('Please select a transcription from the dropdown');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.avoma.com/v1/transcriptions/${transcriptionUuid}`,
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        const errorDetail = response.body?.detail || 'Transcription not found';
        throw new Error(`Transcription not found: ${errorDetail}`);
      } else if (response.status >= 400) {
        const errorDetail = response.body?.detail || JSON.stringify(response.body) || 'Unknown error';
        throw new Error(`API error (${response.status}): ${errorDetail}`);
      }

      const transcription = response.body;
      return {
        success: true,
        meeting_uuid: transcription.meeting_uuid,
        transcription_uuid: transcription.uuid,
        transcription_vtt_url: transcription.transcription_vtt_url,
        speakers: transcription.speakers || [],
        transcript: transcription.transcript || [],
        transcript_paragraphs_count: transcription.transcript?.length || 0,
        speakers_count: transcription.speakers?.length || 0,
        note: 'Use transcription_vtt_url to download the VTT subtitle file for the meeting'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to retrieve transcription: ${errorMessage}`);
    }
  }
});