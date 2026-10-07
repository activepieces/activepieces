import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { IdempotencyStore, squareIdempotency } from '../common/idempotency';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const createPaymentLinkAction = createAction({
  name: 'create_payment_link',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Create Payment Link',
  description: 'Creates a Square checkout link for a fixed amount that you can send to a buyer. Needs a connection created or reconnected with piece version 1.0.0 or later.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a quick-pay checkout link at a location picked from a list; agents use Create Payment Link (by ID). A retried step in the same run returns the same link.',
    idempotent: false,
  },
  props: {
    location_id: squareProps.location({ required: false }),
    ...linkProps(),
  },
  outputSchema: squareOutputSchemas.paymentLink,
  async run(context) {
    return runCreateLink({ context, locationLabel: 'Location' });
  },
});

function linkProps() {
  return {
    name: Property.ShortText({ displayName: 'Item Name', description: 'What the buyer pays for, shown on the checkout page.', required: true }),
    amount: Property.ShortText({ displayName: 'Amount', description: 'For example 12.50.', required: true }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'Leave empty to use the location currency.', required: false }),
    description: Property.ShortText({ displayName: 'Description', description: 'Internal description, not shown to the buyer.', required: false }),
    payment_note: Property.ShortText({ displayName: 'Payment Note', description: 'Added to the resulting payment.', required: false }),
    redirect_url: Property.ShortText({ displayName: 'Redirect URL', description: 'Where to send the buyer after paying.', required: false }),
    idempotency_key: squareProps.idempotencyKey(),
  };
}

async function runCreateLink({ context, locationLabel }: { context: LinkContext; locationLabel: string }) {
  const p = context.propsValue;
  const input = { location_id: p['location_id'], name: p['name'], amount: p['amount'], currency: p['currency'], description: p['description'], payment_note: p['payment_note'], redirect_url: p['redirect_url'] };
  return squareIdempotency.execute({
    context,
    action: 'create_payment_link',
    input,
    send: ({ idempotencyKey }) =>
      squareOps.createPaymentLink({
        auth: context.auth,
        locationId: squareInputs.optionalId({ value: p['location_id'], label: locationLabel }),
        name: squareInputs.requireText({ value: p['name'], label: 'Item Name' }),
        amount: p['amount'],
        currency: p['currency'],
        description: squareInputs.text(p['description']),
        paymentNote: squareInputs.text(p['payment_note']),
        redirectUrl: squareInputs.url({ value: p['redirect_url'], label: 'Redirect URL' }),
        idempotencyKey,
      }),
  });
}

export const paymentLinkShared = { linkProps, runCreateLink };

type LinkContext = {
  auth: { access_token: string };
  propsValue: Record<string, unknown>;
  store: IdempotencyStore;
  run?: { id: string };
  step?: { name: string };
};
