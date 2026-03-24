import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../..';

export const getAudioTranscription = createAction({
  auth: screenpipeAuth,
  name: 'get_audio_transcription',
  displayName: 'Get Audio Transcription',
  description: 'Search audio transcriptions from Screenpipe',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text to search for in audio transcriptions (leave empty to get all)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'Filter results after this time (ISO 8601 format)',
      required: false,
    }),
    end_time: Property.ShortText({
      displayName: 'End Time',
      description: 'Filter results before this time (ISO 8601 format)',
      required: false,
    }),
    speaker_name: Property.ShortText({
      displayName: 'Speaker Name',
      description: 'Filter by speaker name (case-insensitive partial match)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const baseUrl = auth.props.base_url.replace(/\/$/, '');

    const queryParams: Record<string, string> = {
      content_type: 'audio',
    };
    if (propsValue.query) queryParams['q'] = propsValue.query;
    if (propsValue.limit !== undefined && propsValue.limit !== null) {
      queryParams['limit'] = String(propsValue.limit);
    }
    if (propsValue.start_time) queryParams['start_time'] = propsValue.start_time;
    if (propsValue.end_time) queryParams['end_time'] = propsValue.end_time;
    if (propsValue.speaker_name) queryParams['speaker_name'] = propsValue.speaker_name;

    const params = new URLSearchParams(queryParams).toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/search?${params}`,
    });

    return response.body;
  },
});
