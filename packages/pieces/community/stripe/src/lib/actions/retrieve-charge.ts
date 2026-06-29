import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeRetrieveCharge = createAction({
  name: 'retrieve_charge',
  auth: stripeAuth,
  displayName: 'Retrieve Charge (Agent)',
  description: 'Retrieve a Stripe charge by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe charge by its charge ID (e.g., ch_...). Charges are the legacy, read-mostly view of a payment; for the modern object use Get Payment Intent. Use List/Search Charges to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    charge_id: Property.ShortText({
      displayName: 'Charge ID',
      description:
        'The Stripe charge ID (e.g., ch_...). Obtain it from List Charges or Search Charges.',
      required: true,
    }),
  },
  async run(context) {
    const { charge_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/charges/${charge_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});
