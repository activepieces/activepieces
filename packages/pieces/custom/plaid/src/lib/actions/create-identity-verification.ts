import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plaidAuth } from '../..';

export const createIdentityVerification = createAction({
  name: 'create_identity_verification',
  auth: plaidAuth,
  displayName: 'Create Identity Verification',
  description: 'Initiate an identity verification process',
  props: {
    isShareableUrl: Property.Checkbox({
      displayName: 'Is Shareable URL',
      description: 'Whether to create a shareable URL for the verification',
      required: false,
      defaultValue: false,
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the identity verification template',
      required: true,
    }),
    gaveConsent: Property.Checkbox({
      displayName: 'Gave Consent',
      description: 'Whether the user gave consent',
      required: true,
    }),
    user: Property.Json({
      displayName: 'User Data',
      description: 'User information for verification (email_address, phone_number, date_of_birth, name, address)',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const { isShareableUrl, templateId, gaveConsent, user } = context.propsValue;

    const baseUrl = `https://${auth.environment || 'sandbox'}.plaid.com`;

    const body: any = {
      is_shareable_url: isShareableUrl,
      template_id: templateId,
      gave_consent: gaveConsent,
    };

    if (user) {
      body.user = user;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/identity_verification/create`,
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': auth.clientId,
        'PLAID-SECRET': auth.secret,
      },
      body,
    });

    return response.body;
  },
});
