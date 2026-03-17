import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { pinchPaymentsClient } from '../common/client';

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
      environment: context.auth.props.environment
    };
    
    return pinchPaymentsClient(credentials, HttpMethod.GET, `/payers/${payerId}`);
  },
});
