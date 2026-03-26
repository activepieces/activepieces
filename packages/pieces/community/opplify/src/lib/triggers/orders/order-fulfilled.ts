import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const orderFulfilled = createOpplifyTrigger({
  name: 'order_fulfilled',
  displayName: 'Order Fulfilled',
  description:
    'Triggers when an order is marked as fulfilled/delivered.',
  eventType: 'order_fulfilled',
  props: {},
  sampleData: SAMPLE_DATA.order_fulfilled,
});
