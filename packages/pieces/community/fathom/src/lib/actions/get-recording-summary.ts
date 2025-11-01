import { fathomAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getRecordingSummary = createAction({
  name: 'getRecordingSummary',
  displayName: 'Get Recording Summary',
  description: 'Get the summary of a recording',
  auth: fathomAuth,
  props: {
    recording_id: Property.Number({
      displayName: 'Recording ID',
      description: 'The ID of the meeting recording to fetch the call summary for',
      required: true,
    }),
    destination_url: Property.ShortText({
      displayName: 'Destination URL',
      description: 'Optional: Destination URL for where Fathom will POST the call summary. If not provided, the endpoint will return the data directly.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const url = `https://api.fathom.ai/external/v1/recordings/${propsValue.recording_id}/summary`;
    
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
