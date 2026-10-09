import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { yocoAuth } from '../auth';
import { yocoRequest } from '../common/client';

export const createCheckoutAction = createAction({
  auth: yocoAuth,
  name: 'create_checkout',
  displayName: 'Create Checkout',
  description:
    'Create a Yoco hosted checkout. Returns a redirect URL to send the customer to.',
  props: {
    amount: Property.Number({
      displayName: 'Amount (ZAR)',
      description: 'Amount in rands, e.g. 250.00',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: true,
      defaultValue: 'ZAR',
      options: {
        options: [{ label: 'ZAR', value: 'ZAR' }],
      },
    }),
    success_url: Property.ShortText({
      displayName: 'Success URL',
      required: true,
    }),
    cancel_url: Property.ShortText({
      displayName: 'Cancel URL',
      required: true,
    }),
    failure_url: Property.ShortText({
      displayName: 'Failure URL',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your own order/invoice reference.',
      required: false,
    }),
    metadata_json: Property.Json({
      displayName: 'Metadata',
      description: 'Optional JSON object attached to the checkout.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const amountCents = Math.round(Number(propsValue.amount) * 100);
    const body: Record<string, unknown> = {
      amount: amountCents,
      currency: propsValue.currency ?? 'ZAR',
      successUrl: propsValue.success_url,
      cancelUrl: propsValue.cancel_url,
      failureUrl: propsValue.failure_url ?? propsValue.cancel_url,
      metadata: {
        reference: propsValue.reference ?? null,
        ...(propsValue.metadata_json as Record<string, unknown> | undefined ?? {}),
      },
    };
    return yocoRequest<Record<string, unknown>>({
      secretKey: auth.props.secret_key,
      method: HttpMethod.POST,
      path: '/checkouts',
      body,
    });
  },
});
