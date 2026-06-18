import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { pinchPaymentsClient } from '../common/client';

export const findPayerAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'find_payer',
  displayName: 'Find Payer',
  description: 'Find a payer by their Payer ID',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single Pinch Payments payer by their payer id (pyr_ prefix). Use to fetch a customer record when you already have its id. Read-only and idempotent; requires a known payer id (this does not search by name or email).', idempotent: true },
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
