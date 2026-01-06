import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';

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

    const tokenResponse = await import('../common/auth').then(auth => 
      auth.getPinchPaymentsToken(credentials)
    );

    const response = await import('@activepieces/pieces-common').then(({ httpClient, HttpMethod }) =>
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.getpinch.com.au/test/payers/${payerId}`,
        headers: {
          'Authorization': `Bearer ${tokenResponse.access_token}`,
          'Content-Type': 'application/json',
        },
      })
    );

    return response.body;
  },
});
