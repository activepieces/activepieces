import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cashfreePaymentsAuth } from '../auth/cashgram-auth';

export const createPaymentLink = createAction({
  name: 'create-payment-link',
  displayName: 'Create Payment Link',
  description: 'Creates a payment link in Cashfree Payment Gateway',
  auth: cashfreePaymentsAuth,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Choose the environment for API calls',
      required: true,
      defaultValue: 'sandbox',
      options: {
        disabled: false,
        options: [
          {
            label: 'Sandbox',
            value: 'sandbox',
          },
          {
            label: 'Production',
            value: 'production',
          },
        ],
      },
    }),

    // Required Fields
    linkAmount: Property.Number({
      displayName: 'Link Amount',
      description: 'Amount to be collected using this link. Provide up to two decimals for paise',
      required: true,
    }),
    linkCurrency: Property.StaticDropdown({
      displayName: 'Link Currency',
      description: 'Currency for the payment link',
      required: true,
      defaultValue: 'INR',
      options: {
        disabled: false,
        options: [
          { label: 'Indian Rupee (INR)', value: 'INR' },
          { label: 'US Dollar (USD)', value: 'USD' },
          { label: 'Euro (EUR)', value: 'EUR' },
          { label: 'British Pound (GBP)', value: 'GBP' },
        ],
      },
    }),
    linkPurpose: Property.ShortText({
      displayName: 'Link Purpose',
      description: 'A brief description for which payment must be collected (max 500 characters)',
      required: true,
    }),
    customerPhone: Property.ShortText({
      displayName: 'Customer Phone',
      description: 'Customer phone number (required)',
      required: true,
    }),

    // Optional Customer Details
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Customer email address',
      required: false,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Customer name',
      required: false,
    }),
    customerBankAccountNumber: Property.ShortText({
      displayName: 'Customer Bank Account Number',
      description: 'Customer bank account number',
      required: false,
    }),
    customerBankIfsc: Property.ShortText({
      displayName: 'Customer Bank IFSC',
      description: 'Customer bank IFSC code',
      required: false,
    }),
    customerBankCode: Property.StaticDropdown({
      displayName: 'Customer Bank Code',
      description: 'Customer bank code for net banking',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'State Bank of India (3003)', value: 3003 },
          { label: 'HDFC Bank (3005)', value: 3005 },
          { label: 'ICICI Bank (3006)', value: 3006 },
          { label: 'Axis Bank (3010)', value: 3010 },
          { label: 'Punjab National Bank (3012)', value: 3012 },
          { label: 'Bank of Baroda (3016)', value: 3016 },
          { label: 'Canara Bank (3019)', value: 3019 },
          { label: 'Union Bank of India (3020)', value: 3020 },
          { label: 'Bank of India (3021)', value: 3021 },
          { label: 'Central Bank of India (3022)', value: 3022 },
          { label: 'Indian Bank (3023)', value: 3023 },
          { label: 'Indian Overseas Bank (3024)', value: 3024 },
          { label: 'UCO Bank (3026)', value: 3026 },
          { label: 'Bank of Maharashtra (3027)', value: 3027 },
          { label: 'Punjab & Sind Bank (3028)', value: 3028 },
          { label: 'IDBI Bank (3029)', value: 3029 },
          { label: 'Federal Bank (3030)', value: 3030 },
          { label: 'South Indian Bank (3031)', value: 3031 },
          { label: 'IndusInd Bank (3032)', value: 3032 },
          { label: 'YES Bank (3033)', value: 3033 },
          { label: 'Kotak Mahindra Bank (7001)', value: 7001 },
        ],
      },
    }),

    // Link Configuration
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'Unique identifier for the link. Alphanumeric, "-" and "_" only (max 50 characters). Auto-generated if not provided',
      required: false,
    }),
    linkPartialPayments: Property.Checkbox({
      displayName: 'Enable Partial Payments',
      description: 'Allow customers to make partial payments for the link',
      required: false,
    }),
    linkMinimumPartialAmount: Property.Number({
      displayName: 'Minimum Partial Amount',
      description: 'Minimum amount in first installment (required if partial payments enabled)',
      required: false,
    }),
    linkExpiryTime: Property.ShortText({
      displayName: 'Link Expiry Time',
      description: 'ISO 8601 format. Example: 2021-07-02T10:20:12+05:30. Default is 30 days',
      required: false,
    }),

    // Notification Settings
    sendSms: Property.Checkbox({
      displayName: 'Send SMS Notification',
      description: 'Send SMS notification to customer phone',
      required: false,
    }),
    sendEmail: Property.Checkbox({
      displayName: 'Send Email Notification',
      description: 'Send email notification to customer email',
      required: false,
    }),
    linkAutoReminders: Property.Checkbox({
      displayName: 'Auto Reminders',
      description: 'Send automatic reminders to customers for payment collection',
      required: false,
    }),

    // Link Meta
    notifyUrl: Property.ShortText({
      displayName: 'Notify URL',
      description: 'HTTPS URL for server-to-server notifications',
      required: false,
    }),
    returnUrl: Property.ShortText({
      displayName: 'Return URL',
      description: 'URL to redirect user after payment completion (max 250 characters)',
      required: false,
    }),
    upiIntent: Property.Checkbox({
      displayName: 'UPI Intent',
      description: 'Directly open UPI Intent flow on mobile devices',
      required: false,
    }),
    paymentMethods: Property.ShortText({
      displayName: 'Payment Methods',
      description: 'Comma-separated values: cc,dc,ccc,ppc,nb,upi,paypal,app. Leave blank for all methods',
      required: false,
    }),

    // Additional Data
    linkNotes: Property.LongText({
      displayName: 'Link Notes',
      description: 'Key-value pairs as JSON. Maximum 5 key-value pairs. Example: {"key_1":"value_1","key_2":"value_2"}',
      required: false,
    }),

    // Order Splits
    orderSplits: Property.LongText({
      displayName: 'Order Splits',
      description: 'JSON array for Easy Split. Example: [{"vendor_id":"vendor1","amount":100}]',
      required: false,
    }),
  },

  async run(context) {
    // Get authentication values from piece-level auth
    const { clientId, clientSecret } = context.auth.props


    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: 'Client ID and Client Secret are required',
        message: 'Please provide both Client ID and Client Secret for authentication',
      };
    }

    // Get action-specific values from props
    const {
      environment,
      linkAmount,
      linkCurrency,
      linkPurpose,
      customerPhone,
      customerEmail,
      customerName,
      customerBankAccountNumber,
      customerBankIfsc,
      customerBankCode,
      linkId,
      linkPartialPayments,
      linkMinimumPartialAmount,
      linkExpiryTime,
      sendSms,
      sendEmail,
      linkAutoReminders,
      notifyUrl,
      returnUrl,
      upiIntent,
      paymentMethods,
      linkNotes,
      orderSplits,
    } = context.propsValue;

    // Determine the base URL based on environment
    const baseUrl = environment === 'production'
      ? 'https://api.cashfree.com/pg/links'
      : 'https://sandbox.cashfree.com/pg/links';

    // Generate link ID if not provided
    const generatedLinkId = linkId || `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build customer details object
    const customerDetails: any = {
      customer_phone: customerPhone,
    };

    if (customerEmail) customerDetails.customer_email = customerEmail;
    if (customerName) customerDetails.customer_name = customerName;
    if (customerBankAccountNumber) customerDetails.customer_bank_account_number = customerBankAccountNumber;
    if (customerBankIfsc) customerDetails.customer_bank_ifsc = customerBankIfsc;
    if (customerBankCode) customerDetails.customer_bank_code = customerBankCode;

    // Build link notify object
    const linkNotify: any = {};
    if (sendSms !== undefined) linkNotify.send_sms = sendSms;
    if (sendEmail !== undefined) linkNotify.send_email = sendEmail;

    // Build link meta object
    const linkMeta: any = {};
    if (notifyUrl) linkMeta.notify_url = notifyUrl;
    if (returnUrl) linkMeta.return_url = returnUrl;
    if (upiIntent !== undefined) linkMeta.upi_intent = upiIntent;
    if (paymentMethods) linkMeta.payment_methods = paymentMethods;

    // Parse link notes if provided
    let parsedLinkNotes;
    if (linkNotes) {
      try {
        parsedLinkNotes = JSON.parse(linkNotes);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON format for link notes',
          message: 'Link notes must be valid JSON format. Example: {"key_1":"value_1","key_2":"value_2"}',
        };
      }
    }

    // Parse order splits if provided
    let parsedOrderSplits;
    if (orderSplits) {
      try {
        parsedOrderSplits = JSON.parse(orderSplits);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON format for order splits',
          message: 'Order splits must be valid JSON array. Example: [{"vendor_id":"vendor1","amount":100}]',
        };
      }
    }

    // Prepare the request body
    const requestBody: any = {
      link_amount: linkAmount,
      link_currency: linkCurrency,
      link_purpose: linkPurpose,
      customer_details: customerDetails,
      link_id: generatedLinkId,
    };

    // Add optional fields
    if (linkPartialPayments !== undefined) requestBody.link_partial_payments = linkPartialPayments;
    if (linkMinimumPartialAmount) requestBody.link_minimum_partial_amount = linkMinimumPartialAmount;
    if (linkExpiryTime) requestBody.link_expiry_time = linkExpiryTime;
    if (Object.keys(linkNotify).length > 0) requestBody.link_notify = linkNotify;
    if (linkAutoReminders !== undefined) requestBody.link_auto_reminders = linkAutoReminders;
    if (Object.keys(linkMeta).length > 0) requestBody.link_meta = linkMeta;
    if (parsedLinkNotes) requestBody.link_notes = parsedLinkNotes;
    if (parsedOrderSplits) requestBody.order_splits = parsedOrderSplits;

    // Build headers - only client credentials supported
    const headers: any = {
      'x-api-version': '2025-01-01',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: baseUrl,
        headers: headers,
        body: requestBody,
      });

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.body,
          message: 'Payment link created successfully',

        };
      } else {
        return {
          success: false,
          error: response.body,
          message: 'Failed to create payment link',
          status: response.status,
        };
      }
    } catch (error) {
      console.error('Error creating Cashfree payment link:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while creating the payment link',
      };
    }
  },
});
