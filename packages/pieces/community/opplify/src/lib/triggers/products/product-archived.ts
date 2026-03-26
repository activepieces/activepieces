import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const productArchived = createOpplifyTrigger({
  name: 'product_archived',
  displayName: 'Product Archived',
  description: 'Triggers when a product is archived or deactivated.',
  eventType: 'product_archived',
  sampleData: SAMPLE_DATA.product_archived,
});
