import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retellAiAuth } from '../..';
import { retellAiCommon } from '../common';

export const getCallAction = createAction({
  auth: retellAiAuth,
  name: 'get_call',
  displayName: 'Get a Call',
  description: 'Retrieve detailed data of a specific call (e.g., transcript), given a Call ID.',
  props: {
    call_id: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { call_id } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${retellAiCommon.baseUrl}/v2/get-call/${call_id}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
