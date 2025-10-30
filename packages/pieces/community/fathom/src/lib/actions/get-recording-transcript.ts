import { fathomAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getRecordingTranscript = createAction({
  name: 'getRecordingTranscript',
  displayName: 'Get Recording Transcript',
  description: 'Get the transcript of a recording',
  auth: fathomAuth,
  props: {
    recording_id: Property.Number({
      displayName: 'Recording ID',
      description: 'The ID of the meeting recording to fetch the transcript for',
      required: true,
    }),
    destination_url: Property.ShortText({
      displayName: 'Destination URL',
      description: 'Optional: Destination URL for where Fathom will POST the transcript. If not provided, the endpoint will return the data directly.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const url = `https://api.fathom.ai/external/v1/recordings/${propsValue.recording_id}/transcript`;
    
    const queryParams = propsValue.destination_url 
      ? `?destination_url=${encodeURIComponent(propsValue.destination_url)}`
      : '';

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url + queryParams,
      headers: {
        'X-Api-Key': auth,
      },
    });

    return response.body;
  },
});
