import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const orderCancelled = createOpplifyTrigger({
  name: 'order_cancelled',
  displayName: 'Order Cancelled',
  description: 'Triggers when an order is cancelled.',
  eventType: 'order_cancelled',
  props: {},
  sampleData: SAMPLE_DATA.order_cancelled,
});
