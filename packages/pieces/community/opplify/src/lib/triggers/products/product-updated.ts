import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const productUpdated = createOpplifyTrigger({
  name: 'product_updated',
  displayName: 'Product Updated',
  description: 'Triggers when a product\'s details are changed (name, price, description, etc.).',
  eventType: 'product_updated',
  sampleData: SAMPLE_DATA.product_updated,
});
