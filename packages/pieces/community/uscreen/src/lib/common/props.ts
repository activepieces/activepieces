import { Property } from '@activepieces/pieces-framework';
import { UscreenClient, UscreenProduct } from './client';
import { uscreenAuth } from './auth';

export const uscreenProps = {
  customerId: (required = true) =>
    Property.Dropdown({
      auth: uscreenAuth,
      displayName: 'Customer ID or Email',
      description: 'The unique ID or email address of the customer.',
      required: required,
      refreshers: ['productType'],
      options: async (context) => {
        const auth = context['auth'];
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = new UscreenClient(auth.secret_text);
        const customers = await client.getCustomers();
        return {
          disabled: false,
          options: customers.map((customer) => ({
            label: customer.email,
            value: customer.id,
          })),
        };
      },
    }),

  productType: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'The type of product to assign.',
      required: required,
      options: {
        options: [
          { label: 'Program (Bundle)', value: 'program' },
          { label: 'Offer (Subscription)', value: 'offer' },
        ],
      },
    }),

  productId: (required = true) =>
    Property.Dropdown({
      auth: uscreenAuth,
      displayName: 'Product',
      description: 'The bundle (program) or subscription (offer) to assign.',
      required: required,
      refreshers: ['productType'],
      options: async (context) => {
        const auth = context['auth'];

        const propsValue = context['propsValue'] as Record<string, unknown>;
        const productType = propsValue['productType'] as
          | 'program'
          | 'offer'
          | undefined;

        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        if (!productType) {
          return {
            disabled: true,
            placeholder: 'Select a Product Type first',
            options: [],
          };
        }

        const client = new UscreenClient(auth.secret_text);

        let products: UscreenProduct[] = [];

        if (productType === 'program') {
          products = await client.getPrograms();
        } else if (productType === 'offer') {
          products = await client.getOffers();
        }

        return {
          disabled: false,
          options: products.map((product) => ({
            label: product.name,
            value: product.id,
          })),
        };
      },
    }),

  webhookInstructions: (required = true) =>
    Property.MarkDown({
      value: `## Setup Instructions

### 1. Access Uscreen Webhook Settings
- Log into your **Uscreen Admin Panel**
- Navigate to **Settings** > **Webhooks**

### 2. Create New Webhook
- Click **"New Webhook"**
- **Callback URL**: 
\`\`\`text
{{webhookUrl}}
\`\`\`
- Select the appropriate event 
- Click **Save**`,
    }),
};
