import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth, getEnvironmentFromApiKey } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createPaymentLinkAction = createAction({
  name: 'create_payment_link',
  auth: checkoutComAuth,
  displayName: 'Create Payment Link',
  description: 'Create a Payment Link to accept and process payment details.',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The payment amount in minor units (e.g., cents for USD)',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The three-letter ISO currency code (e.g., USD, EUR)',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'A reference to identify the payment (e.g., order number)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the payment',
      required: false,
    }),
    
    billing_country: Property.ShortText({
      displayName: 'Billing Country',
      description: 'The two-letter ISO country code (e.g., US, GB)',
      required: true,
    }),
    billing_address_line1: Property.ShortText({
      displayName: 'Billing Address Line 1',
      description: 'The first line of the billing address',
      required: false,
    }),
    billing_address_line2: Property.ShortText({
      displayName: 'Billing Address Line 2',
      description: 'The second line of the billing address',
      required: false,
    }),
    billing_city: Property.ShortText({
      displayName: 'Billing City',
      description: 'The billing address city',
      required: false,
    }),
    billing_state: Property.ShortText({
      displayName: 'Billing State',
      description: 'The state or province (ISO 3166-2 code)',
      required: false,
    }),
    billing_zip: Property.ShortText({
      displayName: 'Billing ZIP',
      description: 'The billing address zip or postal code',
      required: false,
    }),
    billing_phone_country_code: Property.ShortText({
      displayName: 'Billing Phone Country Code',
      description: 'The international country calling code (e.g., +1)',
      required: false,
    }),
    billing_phone_number: Property.ShortText({
      displayName: 'Billing Phone Number',
      description: 'The phone number (6-25 characters)',
      required: false,
    }),
    
    // Customer Information
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'The customer\'s email address',
      required: false,
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'The customer\'s name',
      required: false,
    }),
    customer_phone_country_code: Property.ShortText({
      displayName: 'Customer Phone Country Code',
      description: 'The international country calling code (e.g., +1)',
      required: false,
    }),
    customer_phone_number: Property.ShortText({
      displayName: 'Customer Phone Number',
      description: 'The customer\'s phone number',
      required: false,
    }),
    
    // Payment Configuration
    expires_in: Property.Number({
      displayName: 'Expires In (seconds)',
      description: 'Time for which the link remains valid (default: 86400)',
      required: false,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'The merchant name to display to customers on the checkout page',
      required: false,
    }),
    return_url: Property.ShortText({
      displayName: 'Return URL',
      description: 'URL to redirect customer after successful payment',
      required: false,
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'Language and region for the payment page',
      required: false,
      options: {
        options: [
          { label: 'English (GB)', value: 'en-GB' },
          { label: 'Arabic', value: 'ar' },
          { label: 'Danish (Denmark)', value: 'da-DK' },
          { label: 'German (Germany)', value: 'de-DE' },
          { label: 'Greek', value: 'el' },
          { label: 'Spanish (Spain)', value: 'es-ES' },
          { label: 'Finnish (Finland)', value: 'fi-FI' },
          { label: 'Filipino (Philippines)', value: 'fil-PH' },
          { label: 'French (France)', value: 'fr-FR' },
          { label: 'Hindi (India)', value: 'hi-IN' },
          { label: 'Indonesian (Indonesia)', value: 'id-ID' },
          { label: 'Italian (Italy)', value: 'it-IT' },
          { label: 'Japanese (Japan)', value: 'ja-JP' },
          { label: 'Malay (Malaysia)', value: 'ms-MY' },
          { label: 'Norwegian (Norway)', value: 'nb-NO' },
          { label: 'Dutch (Netherlands)', value: 'nl-NL' },
          { label: 'Portuguese (Portugal)', value: 'pt-PT' },
          { label: 'Swedish (Sweden)', value: 'sv-SE' },
          { label: 'Thai (Thailand)', value: 'th-TH' },
          { label: 'Vietnamese (Vietnam)', value: 'vi-VN' },
          { label: 'Chinese (China)', value: 'zh-CN' },
          { label: 'Chinese (Hong Kong)', value: 'zh-HK' },
          { label: 'Chinese (Taiwan)', value: 'zh-TW' },
        ],
      },
    }),
    
    // Payment Methods Control
    allow_payment_methods: Property.StaticMultiSelectDropdown({
      displayName: 'Allow Payment Methods',
      description: 'Specific payment methods to present to customers',
      required: false,
      options: {
        options: [
          { label: 'Card', value: 'card' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Apple Pay', value: 'applepay' },
          { label: 'Google Pay', value: 'googlepay' },
          { label: 'Klarna', value: 'klarna' },
          { label: 'Alipay CN', value: 'alipay_cn' },
          { label: 'Bancontact', value: 'bancontact' },
          { label: 'iDEAL', value: 'ideal' },
          { label: 'SEPA', value: 'sepa' },
          { label: 'Benefit', value: 'benefit' },
          { label: 'KNet', value: 'knet' },
          { label: 'STC Pay', value: 'stcpay' },
          { label: 'Tabby', value: 'tabby' },
          { label: 'Tamara', value: 'tamara' },
        ],
      },
    }),
    disabled_payment_methods: Property.StaticMultiSelectDropdown({
      displayName: 'Disabled Payment Methods',
      description: 'Payment methods to NOT present to customers',
      required: false,
      options: {
        options: [
          { label: 'Card', value: 'card' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Apple Pay', value: 'applepay' },
          { label: 'Google Pay', value: 'googlepay' },
          { label: 'Klarna', value: 'klarna' },
          { label: 'Alipay CN', value: 'alipay_cn' },
          { label: 'Bancontact', value: 'bancontact' },
          { label: 'iDEAL', value: 'ideal' },
          { label: 'SEPA', value: 'sepa' },
          { label: 'Benefit', value: 'benefit' },
          { label: 'KNet', value: 'knet' },
          { label: 'STC Pay', value: 'stcpay' },
          { label: 'Tabby', value: 'tabby' },
          { label: 'Tamara', value: 'tamara' },
        ],
      },
    }),
    
    // Products/Line Items
    products: Property.Array({
      displayName: 'Products',
      description: 'Details about the products in the order',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Product Name',
          description: 'The descriptive name of the product',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'The number of items',
          required: true,
        }),
        price: Property.Number({
          displayName: 'Price',
          description: 'The price per item in minor units',
          required: true,
        }),
        reference: Property.ShortText({
          displayName: 'Product Reference',
          description: 'Product SKU or reference',
          required: false,
        }),
      },
    }),
    
    // Shipping Information
    shipping_country: Property.ShortText({
      displayName: 'Shipping Country',
      description: 'The two-letter ISO country code for shipping',
      required: false,
    }),
    shipping_address_line1: Property.ShortText({
      displayName: 'Shipping Address Line 1',
      description: 'The first line of the shipping address',
      required: false,
    }),
    shipping_address_line2: Property.ShortText({
      displayName: 'Shipping Address Line 2',
      description: 'The second line of the shipping address',
      required: false,
    }),
    shipping_city: Property.ShortText({
      displayName: 'Shipping City',
      description: 'The shipping address city',
      required: false,
    }),
    shipping_state: Property.ShortText({
      displayName: 'Shipping State',
      description: 'The state or province for shipping',
      required: false,
    }),
    shipping_zip: Property.ShortText({
      displayName: 'Shipping ZIP',
      description: 'The shipping address zip or postal code',
      required: false,
    }),
    
    // Advanced Settings
    payment_type: Property.StaticDropdown({
      displayName: 'Payment Type',
      description: 'Type of payment for card transactions',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'Regular' },
          { label: 'Recurring', value: 'Recurring' },
        ],
      },
    }),
    processing_channel_id: Property.ShortText({
      displayName: 'Processing Channel ID',
      description: 'The processing channel to be used for the payment. Find this in your Checkout.com dashboard under Settings > Processing Channels. Format: pc_xxxxxxxxxxxxxxxxxxxxxxxxxx',
      required: true,
    }),
    capture: Property.Checkbox({
      displayName: 'Capture Payment',
      description: 'Whether to capture the payment immediately',
      required: false,
    }),
    enable_3ds: Property.Checkbox({
      displayName: 'Enable 3D Secure',
      description: 'Whether to process as 3D Secure payment',
      required: false,
    }),
    challenge_3ds: Property.StaticDropdown({
      displayName: '3DS Challenge Preference',
      description: 'Preference for 3DS challenge',
      required: false,
      options: {
        options: [
          { label: 'No Preference', value: 'no_preference' },
          { label: 'No Challenge Requested', value: 'no_challenge_requested' },
          { label: 'Challenge Requested', value: 'challenge_requested' },
        ],
      },
    }),
    
    // Metadata
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional key-value pairs for transaction information',
      required: false,
    }),
  },
  async run(context) {
    const { 
      amount, 
      currency, 
      reference, 
      description,
      billing_country,
      billing_address_line1,
      billing_address_line2,
      billing_city,
      billing_state,
      billing_zip,
      billing_phone_country_code,
      billing_phone_number,
      customer_email, 
      customer_name, 
      customer_phone_country_code,
      customer_phone_number,
      expires_in,
      display_name,
      return_url,
      locale,
      allow_payment_methods,
      disabled_payment_methods,
      products,
      shipping_country,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_zip,
      payment_type,
      processing_channel_id,
      capture,
      enable_3ds,
      challenge_3ds,
      metadata
    } = context.propsValue;
    
    const { baseUrl } = getEnvironmentFromApiKey(context.auth);
    
    const body: Record<string, any> = {
      amount,
      currency,
      billing: {
        address: {
          country: billing_country,
        },
      },
    };
    
    // Add optional billing address fields
    if (billing_address_line1) {
      body['billing']['address']['address_line1'] = billing_address_line1;
    }
    if (billing_address_line2) {
      body['billing']['address']['address_line2'] = billing_address_line2;
    }
    if (billing_city) {
      body['billing']['address']['city'] = billing_city;
    }
    if (billing_state) {
      body['billing']['address']['state'] = billing_state;
    }
    if (billing_zip) {
      body['billing']['address']['zip'] = billing_zip;
    }
    
    // Add billing phone if provided
    if (billing_phone_country_code && billing_phone_number) {
      body['billing']['phone'] = {
        country_code: billing_phone_country_code,
        number: billing_phone_number,
      };
    }
    
    // Add optional core fields
    if (reference) {
      body['reference'] = reference;
    }
    if (description) {
      body['description'] = description;
    }
    if (display_name) {
      body['display_name'] = display_name;
    }
    if (return_url) {
      body['return_url'] = return_url;
    }
    if (locale) {
      body['locale'] = locale;
    }
    if (expires_in) {
      body['expires_in'] = expires_in;
    }
    if (payment_type) {
      body['payment_type'] = payment_type;
    }
    if (processing_channel_id) {
      body['processing_channel_id'] = processing_channel_id;
    }
    if (typeof capture === 'boolean') {
      body['capture'] = capture;
    }
    
    // Add customer information if provided
    if (customer_email || customer_name || (customer_phone_country_code && customer_phone_number)) {
      body['customer'] = {};
      
      if (customer_email) {
        body['customer']['email'] = customer_email;
      }
      if (customer_name) {
        body['customer']['name'] = customer_name;
      }
      if (customer_phone_country_code && customer_phone_number) {
        body['customer']['phone'] = {
          country_code: customer_phone_country_code,
          number: customer_phone_number,
        };
      }
    }
    
    // Add shipping information if provided
    if (shipping_country || shipping_address_line1 || shipping_city || shipping_state || shipping_zip) {
      body['shipping'] = {
        address: {},
      };
      
      if (shipping_country) {
        body['shipping']['address']['country'] = shipping_country;
      }
      if (shipping_address_line1) {
        body['shipping']['address']['address_line1'] = shipping_address_line1;
      }
      if (shipping_address_line2) {
        body['shipping']['address']['address_line2'] = shipping_address_line2;
      }
      if (shipping_city) {
        body['shipping']['address']['city'] = shipping_city;
      }
      if (shipping_state) {
        body['shipping']['address']['state'] = shipping_state;
      }
      if (shipping_zip) {
        body['shipping']['address']['zip'] = shipping_zip;
      }
    }
    
    // Add payment method restrictions
    if (allow_payment_methods && allow_payment_methods.length > 0) {
      body['allow_payment_methods'] = allow_payment_methods;
    }
    if (disabled_payment_methods && disabled_payment_methods.length > 0) {
      body['disabled_payment_methods'] = disabled_payment_methods;
    }
    
    // Add products if provided
    if (products && products.length > 0) {
      body['products'] = products.map((product: any) => ({
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        ...(product.reference && { reference: product.reference }),
      }));
    }
    
    // Add 3DS configuration if enabled
    if (enable_3ds) {
      body['3ds'] = {
        enabled: true,
        ...(challenge_3ds && { challenge_indicator: challenge_3ds }),
      };
    }
    
    // Add metadata if provided
    if (metadata && Object.keys(metadata).length > 0) {
      body['metadata'] = metadata;
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/payment-links`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 422) {
        throw new Error(`Invalid data: ${error.response.body?.error_codes?.join(', ') || 'Please check your input data'}`);
      }
      throw error;
    }
  },
}); 