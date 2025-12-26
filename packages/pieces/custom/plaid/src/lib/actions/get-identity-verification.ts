import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plaidAuth } from '../..';

export const getIdentityVerification = createAction({
  name: 'get_identity_verification',
  auth: plaidAuth,
  displayName: 'Get Identity Verification',
  description: 'Retrieve the status of an identity verification',
  props: {
    identityVerificationId: Property.ShortText({
      displayName: 'Identity Verification ID',
      description: 'The ID of the identity verification to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { identityVerificationId } = context.propsValue;

    const baseUrl = `https://${auth.environment || 'sandbox'}.plaid.com`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/identity_verification/get`,
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': auth.clientId,
        'PLAID-SECRET': auth.secret,
      },
      body: {
        identity_verification_id: identityVerificationId,
      },
    });

    return response.body;
  },
});
