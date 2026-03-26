import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const orderPlaced = createOpplifyTrigger({
  name: 'order_placed',
  displayName: 'Order Placed',
  description:
    'Triggers when a new order is placed via form submission.',
  eventType: 'order_placed',
  props: {},
  sampleData: SAMPLE_DATA.order_placed,
});
