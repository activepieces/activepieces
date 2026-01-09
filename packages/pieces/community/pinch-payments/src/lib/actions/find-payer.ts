import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth, getPinchPaymentsToken } from '../common/auth';

export const findPayerAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'find_payer',
  displayName: 'Find Payer',
  description: 'Find a payer by their Payer ID',
  props: {
    payerId: Property.ShortText({
      displayName: 'Payer ID',
      description: 'The Payer ID in pyr_XXXXXXXXXXXXX format',
      required: true,
    }),
  },
  async run(context) {
    const { payerId } = context.propsValue;

    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const tokenResponse = await getPinchPaymentsToken(credentials);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.getpinch.com.au/test/payers/${payerId}`,
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
