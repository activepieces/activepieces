import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const productCreated = createOpplifyTrigger({
  name: 'product_created',
  displayName: 'Product Created',
  description: 'Triggers when a new product is added to the catalog.',
  eventType: 'product_created',
  sampleData: SAMPLE_DATA.product_created,
});
