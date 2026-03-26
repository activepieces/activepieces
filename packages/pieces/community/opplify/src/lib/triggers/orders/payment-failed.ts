import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const paymentFailed = createOpplifyTrigger({
  name: 'payment_failed',
  displayName: 'Payment Failed',
  description:
    'Triggers when a payment fails (card declined, insufficient funds, etc.).',
  eventType: 'payment_failed',
  props: {},
  sampleData: SAMPLE_DATA.payment_failed,
});
