import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const paymentCompleted = createOpplifyTrigger({
  name: 'payment_completed',
  displayName: 'Payment Completed',
  description:
    'Triggers when payment is successfully processed for an order.',
  eventType: 'payment_completed',
  props: {},
  sampleData: SAMPLE_DATA.payment_completed,
});
