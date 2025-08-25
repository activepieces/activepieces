import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retellAiAuth } from '../..';
import { retellAiCommon } from '../common';

export const getVoiceAction = createAction({
  auth: retellAiAuth,
  name: 'get_voice',
  displayName: 'Get a Voice',
  description: 'Retrieve details for a specific voice model or configuration by ID in Retell AI.',
  props: {
    voice_id: Property.ShortText({
      displayName: 'Voice ID',
      description: 'The unique identifier for the voice (e.g., "11labs-Adrian").',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { voice_id } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${retellAiCommon.baseUrl}/get-voice/${voice_id}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
