import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giftbitAuth } from '../..';
import { giftbitApiCall } from '../common/client';

export const sendReward = createAction({
  name: 'send_reward',
  displayName: 'Send Reward',
  description: 'Sends a gift card reward by email',
  auth: giftbitAuth,
  props: {
    use_testbed: Property.Checkbox({
      displayName: 'Use Testbed Environment',
      description: 'Enable for testing. Disable for production.',
      required: false,
      defaultValue: false,
    }),
    gift_template: Property.ShortText({
      displayName: 'Gift Template ID',
      description: 'Template ID from your Giftbit account (optional if subject/message provided)',
      required: false,
    }),
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Unique identifier for this order',
      required: true,
    }),
    price_in_cents: Property.Number({
      displayName: 'Reward Value (cents)',
      description: 'Value in cents (e.g., 2500 = $25.00)',
      required: true,
    }),
    use_full_catalog: Property.Checkbox({
      displayName: 'Use Full Catalog',
      description: 'Let recipients choose from all brands in their region',
      required: false,
      defaultValue: false,
    }),
    brand_codes: Property.MultiSelectDropdown({
      displayName: 'Brand Codes',
      description: 'Select one or more brands for the reward',
      required: false,
      auth: giftbitAuth,
      refreshers: ['use_testbed'],
      options: async (context) => {
        const { auth, use_testbed } = context;
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await giftbitApiCall({
            auth: auth.secret_text,
            method: HttpMethod.GET,
            resourceUri: '/brands',
            useTestbed: use_testbed as boolean,
          });

          const brands = response.brands ?? [];

          const brandOptions = (brands as { name: string; code: string }[]).map((brand) => ({
            label: `${brand.name} (${brand.code})`,
            value: brand.code,
          }));

          return {
            disabled: false,
            options: brandOptions,
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load brands. Check your API key.',
            options: [],
          };
        }
      },
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'Required for Full Catalog rewards',
      required: false,
      defaultValue: 'United States',
      options: {
        options: [
          { label: 'United States', value: 'United States' },
          { label: 'Canada', value: 'Canada' },
          { label: 'United Kingdom', value: 'United Kingdom' },
          { label: 'Australia', value: 'Australia' },
          { label: 'Germany', value: 'Germany' },
          { label: 'France', value: 'France' },
          { label: 'Italy', value: 'Italy' },
          { label: 'Spain', value: 'Spain' },
          { label: 'Netherlands', value: 'Netherlands' },
          { label: 'Belgium', value: 'Belgium' },
        ],
      },
    }),
    expiry_date: Property.DateTime({
      displayName: 'Expiry Date',
      description: 'Claim deadline (defaults to 1 year if not set)',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Required if no template is used',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Email Message',
      description: 'Required if no template is used',
      required: false,
    }),
    contacts: Property.Array({
      displayName: 'Recipients',
      description: 'List of recipients',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        firstname: Property.ShortText({
          displayName: 'First Name',
          required: false,
        }),
        lastname: Property.ShortText({
          displayName: 'Last Name',
          required: false,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const {
      use_testbed,
      gift_template,
      order_id,
      price_in_cents,
      use_full_catalog,
      brand_codes,
      region,
      expiry_date,
      subject,
      message,
      contacts,
    } = propsValue;

    // Validate required fields
    if (!gift_template && (!subject || !message)) {
      throw new Error('Either gift_template or both subject and message must be provided');
    }

    if (!use_full_catalog && (!brand_codes || brand_codes.length === 0)) {
      throw new Error('Either select brands or enable Full Catalog');
    }

    if (use_full_catalog && !region) {
      throw new Error('Region is required when using Full Catalog');
    }

    const requestBody: any = {
      id: order_id,
      price_in_cents,
      contacts,
    };

    if (gift_template) {
      requestBody.gift_template = gift_template;
    } else {
      requestBody.subject = subject;
      requestBody.message = message;
    }

    if (use_full_catalog) {
      requestBody.region = region;
    } else {
      requestBody.brand_codes = brand_codes;
    }

    if (expiry_date) {
      requestBody.expiry = expiry_date.split('T')[0];
    }

    const response = await giftbitApiCall({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/campaign',
      body: requestBody,
      useTestbed: use_testbed as boolean,
    });

    return response;
  },
});
