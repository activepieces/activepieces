import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const productCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'product_created',
  displayName: 'Product Created',
  description: 'Triggers when a new product is created',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new products (minimum: 5 minutes)',
      required: false,
      defaultValue: 15,
    }),
  },
  sampleData: {
    id: 123,
    name: 'Sample Product',
    type: 'physical',
    sku: 'SAMPLE-001',
    description: 'This is a sample product',
    price: 99.99,
    weight: 1.5,
    is_visible: true,
    is_featured: false,
    date_created: '2024-01-01T12:00:00Z',
    date_modified: '2024-01-01T12:00:00Z',
  },
  async onEnable(context) {
    const lastCheckTime = new Date().toISOString();
    await context.store?.put('lastCheckTime', lastCheckTime);
  },
  async onDisable(context) {
    await context.store?.delete('lastCheckTime');
  },
  async run(context) {
    const { pollingInterval } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 15, 5);

    try {
      const lastCheckTime = await context.store?.get('lastCheckTime') as string;
      const now = new Date();
      
      const checkFromTime = lastCheckTime
        ? new Date(new Date(lastCheckTime).getTime() - (finalPollingInterval * 60 * 1000))
        : new Date(now.getTime() - (finalPollingInterval * 60 * 1000));

      const queryParams: Record<string, string> = {
        limit: '50',
        sort: 'date_created:desc',
      };

      if (lastCheckTime) {
        queryParams['date_created:min'] = checkFromTime.toISOString().split('.')[0] + 'Z';
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/catalog/products',
        method: HttpMethod.GET,
        queryParams,
      });

      const products = (response.body as { data: any[] }).data || [];

      await context.store?.put('lastCheckTime', now.toISOString());

      return products.map(product => ({
        ...product,
        detectedAt: now.toISOString(),
      }));
    } catch (error) {
      console.error('Error polling for new products:', error);
      return [];
    }
  },
});