import { createAction } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';
import { paymentLinkShared } from '../create-payment-link';

export const createPaymentLinkByIdAction = createAction({
  name: 'create_payment_link_by_id',
  classification: 'WRITE',
  auth: squareAuth,
  displayName: 'Create Payment Link (by ID)',
  description: 'Creates a Square checkout link for a fixed amount at a location ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Square quick-pay checkout link (URL) for one named item at a fixed decimal amount like "12.50", at a location ID (empty = main location). It only creates the link; nothing is sent to anyone and no money moves until a buyer pays. Needs PAYMENTS_WRITE (reconnect older connections). A retried step returns the same link instead of repeating the write, and identical calls within one run (for example a loop with the same input) count as one; set Idempotency Key (for example to the loop item) to keep them separate. A new run writes again.',
    idempotent: false,
  },
  props: {
    location_id: squareProps.locationIdText(),
    ...paymentLinkShared.linkProps(),
  },
  outputSchema: squareOutputSchemas.paymentLink,
  async run(context) {
    return paymentLinkShared.runCreateLink({ context, locationLabel: 'Location ID' });
  },
});
