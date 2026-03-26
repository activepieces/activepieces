import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const orderRefunded = createOpplifyTrigger({
  name: 'order_refunded',
  displayName: 'Order Refunded',
  description: 'Triggers when an order is refunded.',
  eventType: 'order_refunded',
  props: {},
  sampleData: SAMPLE_DATA.order_refunded,
});
