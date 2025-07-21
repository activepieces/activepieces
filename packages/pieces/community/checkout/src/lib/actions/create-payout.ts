import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth, getEnvironmentFromApiKey } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createPayoutAction = createAction({
  name: 'create_payment',
  auth: checkoutComAuth,
  displayName: 'Create Payment',
  description: 'Process and manage payments from various sources including card payments and payouts.',
  props: {
    // Core Payment Information
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The three-letter ISO currency code (e.g., USD, EUR)',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The payment amount in minor units (e.g., cents for USD). Use 0 for card verification.',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your reference for the payment (e.g., order number)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the payment',
      required: false,
    }),
    
    // Payment Source - Card Details
    source_type: Property.StaticDropdown({
      displayName: 'Payment Source Type',
      description: 'The type of payment source',
      required: true,
      options: {
        options: [
          { label: 'Card Payment', value: 'card' },
          { label: 'Customer ID', value: 'customer' },
          { label: 'Token', value: 'token' },
          { label: 'Instrument', value: 'instrument' },
        ],
      },
    }),
    card_number: Property.ShortText({
      displayName: 'Card Number',
      description: 'The card number (without separators). Required for card payments.',
      required: false,
    }),
    expiry_month: Property.Number({
      displayName: 'Expiry Month',
      description: 'The expiry month of the card (1-12)',
      required: false,
    }),
    expiry_year: Property.Number({
      displayName: 'Expiry Year',
      description: 'The expiry year of the card (4 digits)',
      required: false,
    }),
    cvv: Property.ShortText({
      displayName: 'CVV',
      description: 'The card verification code (3-4 digits)',
      required: false,
    }),
    cardholder_name: Property.ShortText({
      displayName: 'Cardholder Name',
      description: 'The name of the cardholder',
      required: false,
    }),
    
    // Alternative Source IDs
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer ID (for customer source type, e.g., cus_y3oqhf46pyzuxjocn2giaqnb44)',
      required: false,
    }),
    token_id: Property.ShortText({
      displayName: 'Token ID',
      description: 'The token ID (for token source type)',
      required: false,
    }),
    instrument_id: Property.ShortText({
      displayName: 'Instrument ID',
      description: 'The instrument ID (for instrument source type)',
      required: false,
    }),
    
    // Billing Address
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
      description: 'The billing city',
      required: false,
    }),
    billing_state: Property.ShortText({
      displayName: 'Billing State',
      description: 'The billing state or province',
      required: false,
    }),
    billing_zip: Property.ShortText({
      displayName: 'Billing ZIP',
      description: 'The billing ZIP or postal code',
      required: false,
    }),
    billing_country: Property.ShortText({
      displayName: 'Billing Country',
      description: 'The two-letter ISO country code',
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
    
    // Account Holder Information
    account_holder_first_name: Property.ShortText({
      displayName: 'Account Holder First Name',
      description: 'The first name of the account holder',
      required: false,
    }),
    account_holder_last_name: Property.ShortText({
      displayName: 'Account Holder Last Name',
      description: 'The last name of the account holder',
      required: false,
    }),
    account_holder_middle_name: Property.ShortText({
      displayName: 'Account Holder Middle Name',
      description: 'The middle name of the account holder',
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
      description: 'The international country calling code',
      required: false,
    }),
    customer_phone_number: Property.ShortText({
      displayName: 'Customer Phone Number',
      description: 'The customer\'s phone number',
      required: false,
    }),
    
    // Shipping Information
    shipping_first_name: Property.ShortText({
      displayName: 'Shipping First Name',
      description: 'The first name for shipping',
      required: false,
    }),
    shipping_last_name: Property.ShortText({
      displayName: 'Shipping Last Name',
      description: 'The last name for shipping',
      required: false,
    }),
    shipping_email: Property.ShortText({
      displayName: 'Shipping Email',
      description: 'The email for shipping notifications',
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
      description: 'The shipping city',
      required: false,
    }),
    shipping_state: Property.ShortText({
      displayName: 'Shipping State',
      description: 'The shipping state or province',
      required: false,
    }),
    shipping_zip: Property.ShortText({
      displayName: 'Shipping ZIP',
      description: 'The shipping ZIP or postal code',
      required: false,
    }),
    shipping_country: Property.ShortText({
      displayName: 'Shipping Country',
      description: 'The two-letter ISO country code for shipping',
      required: false,
    }),
    
    // Payment Configuration
    payment_type: Property.StaticDropdown({
      displayName: 'Payment Type',
      description: 'The type of payment',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'Regular' },
          { label: 'Recurring', value: 'Recurring' },
          { label: 'MOTO (Mail Order/Telephone Order)', value: 'MOTO' },
          { label: 'Installment', value: 'Installment' },
          { label: 'Pay Later', value: 'PayLater' },
          { label: 'Unscheduled', value: 'Unscheduled' },
        ],
      },
    }),
    capture: Property.Checkbox({
      displayName: 'Capture Payment',
      description: 'Whether to capture the payment immediately',
      required: false,
    }),
    authorization_type: Property.StaticDropdown({
      displayName: 'Authorization Type',
      description: 'The type of authorization',
      required: false,
      options: {
        options: [
          { label: 'Final', value: 'Final' },
          { label: 'Estimated', value: 'Estimated' },
        ],
      },
    }),
    
    // 3D Secure Configuration
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
          { label: 'Challenge Requested Mandate', value: 'challenge_requested_mandate' },
        ],
      },
    }),
    allow_3ds_upgrade: Property.Checkbox({
      displayName: 'Allow 3DS Upgrade',
      description: 'Process as 3DS if soft declined due to 3DS authentication required',
      required: false,
    }),
    
    // Risk Management
    enable_risk_assessment: Property.Checkbox({
      displayName: 'Enable Risk Assessment',
      description: 'Whether to perform risk assessment',
      required: false,
    }),
    customer_ip: Property.ShortText({
      displayName: 'Customer IP Address',
      description: 'The customer\'s IP address (IPv4 or IPv6)',
      required: false,
    }),
    
    // Processing Options
    processing_channel_id: Property.ShortText({
      displayName: 'Processing Channel ID',
      description: 'The processing channel to use for the payment',
      required: false,
    }),
    previous_payment_id: Property.ShortText({
      displayName: 'Previous Payment ID',
      description: 'Link to existing payment series (for recurring payments)',
      required: false,
    }),
    
    // Success/Failure URLs
    success_url: Property.ShortText({
      displayName: 'Success URL',
      description: 'Success redirect URL for redirect payment methods',
      required: false,
    }),
    failure_url: Property.ShortText({
      displayName: 'Failure URL',
      description: 'Failure redirect URL for redirect payment methods',
      required: false,
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
      currency,
      amount,
      reference,
      description,
      source_type,
      card_number,
      expiry_month,
      expiry_year,
      cvv,
      cardholder_name,
      customer_id,
      token_id,
      instrument_id,
      billing_address_line1,
      billing_address_line2,
      billing_city,
      billing_state,
      billing_zip,
      billing_country,
      billing_phone_country_code,
      billing_phone_number,
      account_holder_first_name,
      account_holder_last_name,
      account_holder_middle_name,
      customer_email,
      customer_name,
      customer_phone_country_code,
      customer_phone_number,
      shipping_first_name,
      shipping_last_name,
      shipping_email,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
      payment_type,
      capture,
      authorization_type,
      enable_3ds,
      challenge_3ds,
      allow_3ds_upgrade,
      enable_risk_assessment,
      customer_ip,
      processing_channel_id,
      previous_payment_id,
      success_url,
      failure_url,
      metadata,
    } = context.propsValue;
    
    const { baseUrl } = getEnvironmentFromApiKey(context.auth);
    
    // Build the request body
    const body: Record<string, any> = {
      currency,
    };
    
    // Add amount if provided
    if (typeof amount === 'number') {
      body['amount'] = amount;
    }
    
    // Add core fields
    if (reference) {
      body['reference'] = reference;
    }
    if (description) {
      body['description'] = description;
    }
    if (payment_type) {
      body['payment_type'] = payment_type;
    }
    if (typeof capture === 'boolean') {
      body['capture'] = capture;
    }
    if (authorization_type) {
      body['authorization_type'] = authorization_type;
    }
    if (processing_channel_id) {
      body['processing_channel_id'] = processing_channel_id;
    }
    if (previous_payment_id) {
      body['previous_payment_id'] = previous_payment_id;
    }
    if (success_url) {
      body['success_url'] = success_url;
    }
    if (failure_url) {
      body['failure_url'] = failure_url;
    }
    
    // Build payment source
    if (source_type) {
      body['source'] = { type: source_type };
      
      if (source_type === 'card') {
        if (!card_number || !expiry_month || !expiry_year) {
          throw new Error('Card number, expiry month, and expiry year are required for card payments');
        }
        
        body['source']['number'] = card_number;
        body['source']['expiry_month'] = expiry_month;
        body['source']['expiry_year'] = expiry_year;
        
        if (cvv) {
          body['source']['cvv'] = cvv;
        }
        if (cardholder_name) {
          body['source']['name'] = cardholder_name;
        }
        
        // Add billing address for card
        if (billing_address_line1 || billing_city || billing_country) {
          body['source']['billing_address'] = {};
          if (billing_address_line1) body['source']['billing_address']['address_line1'] = billing_address_line1;
          if (billing_address_line2) body['source']['billing_address']['address_line2'] = billing_address_line2;
          if (billing_city) body['source']['billing_address']['city'] = billing_city;
          if (billing_state) body['source']['billing_address']['state'] = billing_state;
          if (billing_zip) body['source']['billing_address']['zip'] = billing_zip;
          if (billing_country) body['source']['billing_address']['country'] = billing_country;
        }
        
        // Add billing phone for card
        if (billing_phone_country_code && billing_phone_number) {
          body['source']['phone'] = {
            country_code: billing_phone_country_code,
            number: billing_phone_number,
          };
        }
        
        // Add account holder information
        if (account_holder_first_name && account_holder_last_name) {
          body['source']['account_holder'] = {
            type: 'individual',
            first_name: account_holder_first_name,
            last_name: account_holder_last_name,
          };
          if (account_holder_middle_name) {
            body['source']['account_holder']['middle_name'] = account_holder_middle_name;
          }
        }
      } else if (source_type === 'customer') {
        if (!customer_id) {
          throw new Error('Customer ID is required for customer source type');
        }
        body['source']['id'] = customer_id;
      } else if (source_type === 'token') {
        if (!token_id) {
          throw new Error('Token ID is required for token source type');
        }
        body['source']['token'] = token_id;
      } else if (source_type === 'instrument') {
        if (!instrument_id) {
          throw new Error('Instrument ID is required for instrument source type');
        }
        body['source']['id'] = instrument_id;
      }
    }
    
    // Add customer information
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
    
    // Add shipping information
    if (shipping_first_name || shipping_last_name || shipping_email || shipping_address_line1) {
      body['shipping'] = {};
      if (shipping_first_name) {
        body['shipping']['first_name'] = shipping_first_name;
      }
      if (shipping_last_name) {
        body['shipping']['last_name'] = shipping_last_name;
      }
      if (shipping_email) {
        body['shipping']['email'] = shipping_email;
      }
      
      if (shipping_address_line1 || shipping_city || shipping_country) {
        body['shipping']['address'] = {};
        if (shipping_address_line1) body['shipping']['address']['address_line1'] = shipping_address_line1;
        if (shipping_address_line2) body['shipping']['address']['address_line2'] = shipping_address_line2;
        if (shipping_city) body['shipping']['address']['city'] = shipping_city;
        if (shipping_state) body['shipping']['address']['state'] = shipping_state;
        if (shipping_zip) body['shipping']['address']['zip'] = shipping_zip;
        if (shipping_country) body['shipping']['address']['country'] = shipping_country;
      }
    }
    
    // Add 3DS configuration
    if (enable_3ds) {
      body['3ds'] = {
        enabled: true,
      };
      if (challenge_3ds) {
        body['3ds']['challenge_indicator'] = challenge_3ds;
      }
      if (typeof allow_3ds_upgrade === 'boolean') {
        body['3ds']['allow_upgrade'] = allow_3ds_upgrade;
      }
    }
    
    // Add risk configuration
    if (typeof enable_risk_assessment === 'boolean') {
      body['risk'] = {
        enabled: enable_risk_assessment,
      };
      if (customer_ip) {
        body['risk']['device'] = {
          network: {
            [customer_ip.includes(':') ? 'ipv6' : 'ipv4']: customer_ip,
          },
        };
      }
    }
    
    // Add metadata
    if (metadata && Object.keys(metadata).length > 0) {
      body['metadata'] = metadata;
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/payments`,
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
      if (error.response?.status === 429) {
        throw new Error('Too many requests or duplicate request detected');
      }
      throw error;
    }
  },
}); 