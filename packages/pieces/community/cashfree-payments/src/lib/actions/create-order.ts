import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cashfreePaymentsAuth } from '../auth/cashgram-auth';

export const createOrder = createAction({
  name: 'create-order',
  displayName: 'Create Order',
  description: 'Creates an order in Cashfree Payment Gateway',
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
    orderAmount: Property.Number({
      displayName: 'Order Amount',
      description: 'Bill amount for the order. Provide up to two decimals (e.g., 10.15 means Rs 10 and 15 paisa)',
      required: true,
    }),
    orderCurrency: Property.StaticDropdown({
      displayName: 'Order Currency',
      description: 'Currency for the order',
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
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'A unique identifier for the customer. Use alphanumeric values only (3-50 characters)',
      required: true,
    }),
    customerPhone: Property.ShortText({
      displayName: 'Customer Phone',
      description: 'Customer phone number (minimum 10 digits). For international numbers, prefix with +',
      required: true,
    }),
    
    // Optional Customer Details
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Customer email address (3-100 characters)',
      required: false,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Name of the customer (3-100 characters)',
      required: false,
    }),
    customerBankAccountNumber: Property.ShortText({
      displayName: 'Customer Bank Account Number',
      description: 'Customer bank account. Required for TPV (Third Party Verification) (3-20 characters)',
      required: false,
    }),
    customerBankIfsc: Property.ShortText({
      displayName: 'Customer Bank IFSC',
      description: 'Customer bank IFSC. Required for TPV (Third Party Verification)',
      required: false,
    }),
    customerBankCode: Property.Number({
      displayName: 'Customer Bank Code',
      description: 'Customer bank code. Required for net banking payments with TPV',
      required: false,
    }),
    
    // Order Details
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'Order identifier in your system. Alphanumeric, "_" and "-" only (3-45 characters). Will be auto-generated if not provided',
      required: false,
    }),
    orderNote: Property.ShortText({
      displayName: 'Order Note',
      description: 'Order note for reference (3-200 characters)',
      required: false,
    }),
    orderExpiryTime: Property.ShortText({
      displayName: 'Order Expiry Time',
      description: 'ISO 8601 format. Example: 2021-07-02T10:20:12+05:30',
      required: false,
    }),
    
    // Order Meta
    returnUrl: Property.ShortText({
      displayName: 'Return URL',
      description: 'URL to redirect customer after payment completion (max 250 characters)',
      required: false,
    }),
    notifyUrl: Property.ShortText({
      displayName: 'Notify URL',
      description: 'HTTPS URL for server-to-server notifications (max 250 characters)',
      required: false,
    }),
    paymentMethods: Property.ShortText({
      displayName: 'Payment Methods',
      description: 'Comma-separated values: cc,dc,ccc,ppc,nb,upi,paypal,app,paylater,cardlessemi,dcemi,ccemi,banktransfer',
      required: false,
    }),
    
    // Cart Details
    cartName: Property.ShortText({
      displayName: 'Cart Name',
      description: 'Name of the cart',
      required: false,
    }),
    customerNote: Property.ShortText({
      displayName: 'Customer Note',
      description: 'Note from customer',
      required: false,
    }),
    shippingCharge: Property.Number({
      displayName: 'Shipping Charge',
      description: 'Shipping charges for the order',
      required: false,
    }),
    
    // Shipping Address
    shippingFullName: Property.ShortText({
      displayName: 'Shipping - Full Name',
      description: 'Full name for shipping address',
      required: false,
    }),
    shippingCountry: Property.ShortText({
      displayName: 'Shipping - Country',
      description: 'Country for shipping address',
      required: false,
    }),
    shippingCity: Property.ShortText({
      displayName: 'Shipping - City',
      description: 'City for shipping address',
      required: false,
    }),
    shippingState: Property.ShortText({
      displayName: 'Shipping - State',
      description: 'State for shipping address',
      required: false,
    }),
    shippingPincode: Property.ShortText({
      displayName: 'Shipping - Pincode',
      description: 'Pincode for shipping address',
      required: false,
    }),
    shippingAddress1: Property.ShortText({
      displayName: 'Shipping - Address Line 1',
      description: 'Primary address line for shipping',
      required: false,
    }),
    shippingAddress2: Property.ShortText({
      displayName: 'Shipping - Address Line 2',
      description: 'Secondary address line for shipping',
      required: false,
    }),
    
    // Billing Address
    billingFullName: Property.ShortText({
      displayName: 'Billing - Full Name',
      description: 'Full name for billing address',
      required: false,
    }),
    billingCountry: Property.ShortText({
      displayName: 'Billing - Country',
      description: 'Country for billing address',
      required: false,
    }),
    billingCity: Property.ShortText({
      displayName: 'Billing - City',
      description: 'City for billing address',
      required: false,
    }),
    billingState: Property.ShortText({
      displayName: 'Billing - State',
      description: 'State for billing address',
      required: false,
    }),
    billingPincode: Property.ShortText({
      displayName: 'Billing - Pincode',
      description: 'Pincode for billing address',
      required: false,
    }),
    billingAddress1: Property.ShortText({
      displayName: 'Billing - Address Line 1',
      description: 'Primary address line for billing',
      required: false,
    }),
    billingAddress2: Property.ShortText({
      displayName: 'Billing - Address Line 2',
      description: 'Secondary address line for billing',
      required: false,
    }),
    
    // Terminal (for SoftPOS)
    terminalType: Property.ShortText({
      displayName: 'Terminal Type',
      description: 'Type of terminal (e.g., SPOS) for SoftPOS orders (4-10 characters)',
      required: false,
    }),
    terminalId: Property.ShortText({
      displayName: 'Terminal ID',
      description: 'Terminal ID for merchant reference (3-100 characters)',
      required: false,
    }),
    terminalPhoneNo: Property.ShortText({
      displayName: 'Terminal Phone Number',
      description: 'Mobile number of the terminal/agent/storefront',
      required: false,
    }),
    terminalName: Property.ShortText({
      displayName: 'Terminal Name',
      description: 'Name of terminal/agent/storefront',
      required: false,
    }),
    terminalAddress: Property.ShortText({
      displayName: 'Terminal Address',
      description: 'Location of terminal',
      required: false,
    }),
    terminalNote: Property.ShortText({
      displayName: 'Terminal Note',
      description: 'Note given by merchant while creating the terminal',
      required: false,
    }),
    
    // Products Configuration
    oneClickCheckoutEnabled: Property.Checkbox({
      displayName: 'Enable One Click Checkout',
      description: 'Enable One Click Checkout feature',
      required: false,
    }),
    verifyPayEnabled: Property.Checkbox({
      displayName: 'Enable Verify and Pay',
      description: 'Enable Verify and Pay feature',
      required: false,
    }),
    
    // Order Tags (JSON string)
    orderTags: Property.LongText({
      displayName: 'Order Tags',
      description: 'Custom tags as JSON object. Example: {"product":"Laptop","city":"Bangalore"}. Maximum 10 tags',
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
    
    // Get action-specific values from props (including environment)
    const {
      environment,
      orderAmount,
      orderCurrency,
      customerId,
      customerPhone,
      customerEmail,
      customerName,
      customerBankAccountNumber,
      customerBankIfsc,
      customerBankCode,
      orderId,
      orderNote,
      orderExpiryTime,
      returnUrl,
      notifyUrl,
      paymentMethods,
      cartName,
      customerNote,
      shippingCharge,
      shippingFullName,
      shippingCountry,
      shippingCity,
      shippingState,
      shippingPincode,
      shippingAddress1,
      shippingAddress2,
      billingFullName,
      billingCountry,
      billingCity,
      billingState,
      billingPincode,
      billingAddress1,
      billingAddress2,
      terminalType,
      terminalId,
      terminalPhoneNo,
      terminalName,
      terminalAddress,
      terminalNote,
      oneClickCheckoutEnabled,
      verifyPayEnabled,
      orderTags,
    } = context.propsValue;

    // Determine the base URL based on environment
    const baseUrl = environment === 'production' 
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    // Generate order ID if not provided
    const generatedOrderId = orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build customer details object
    const customerDetails: any = {
      customer_id: customerId,
      customer_phone: customerPhone,
    };
    
    if (customerEmail) customerDetails.customer_email = customerEmail;
    if (customerName) customerDetails.customer_name = customerName;
    if (customerBankAccountNumber) customerDetails.customer_bank_account_number = customerBankAccountNumber;
    if (customerBankIfsc) customerDetails.customer_bank_ifsc = customerBankIfsc;
    if (customerBankCode) customerDetails.customer_bank_code = customerBankCode;

    // Build order meta object
    const orderMeta: any = {};
    if (returnUrl) orderMeta.return_url = returnUrl;
    if (notifyUrl) orderMeta.notify_url = notifyUrl;
    if (paymentMethods) orderMeta.payment_methods = paymentMethods;

    // Build cart details object
    const cartDetails: any = {};
    if (cartName) cartDetails.cart_name = cartName;
    if (customerNote) cartDetails.customer_note = customerNote;
    if (shippingCharge) cartDetails.shipping_charge = shippingCharge;
    
    // Shipping address
    if (shippingFullName || shippingCountry || shippingCity || shippingState || shippingPincode || shippingAddress1 || shippingAddress2) {
      cartDetails.customer_shipping_address = {};
      if (shippingFullName) cartDetails.customer_shipping_address.full_name = shippingFullName;
      if (shippingCountry) cartDetails.customer_shipping_address.country = shippingCountry;
      if (shippingCity) cartDetails.customer_shipping_address.city = shippingCity;
      if (shippingState) cartDetails.customer_shipping_address.state = shippingState;
      if (shippingPincode) cartDetails.customer_shipping_address.pincode = shippingPincode;
      if (shippingAddress1) cartDetails.customer_shipping_address.address_1 = shippingAddress1;
      if (shippingAddress2) cartDetails.customer_shipping_address.address_2 = shippingAddress2;
    }
    
    // Billing address
    if (billingFullName || billingCountry || billingCity || billingState || billingPincode || billingAddress1 || billingAddress2) {
      cartDetails.customer_billing_address = {};
      if (billingFullName) cartDetails.customer_billing_address.full_name = billingFullName;
      if (billingCountry) cartDetails.customer_billing_address.country = billingCountry;
      if (billingCity) cartDetails.customer_billing_address.city = billingCity;
      if (billingState) cartDetails.customer_billing_address.state = billingState;
      if (billingPincode) cartDetails.customer_billing_address.pincode = billingPincode;
      if (billingAddress1) cartDetails.customer_billing_address.address_1 = billingAddress1;
      if (billingAddress2) cartDetails.customer_billing_address.address_2 = billingAddress2;
    }

    // Build terminal object
    const terminal: any = {};
    if (terminalType) {
      terminal.terminal_type = terminalType;
      if (terminalId) terminal.terminal_id = terminalId;
      if (terminalPhoneNo) terminal.terminal_phone_no = terminalPhoneNo;
      if (terminalName) terminal.terminal_name = terminalName;
      if (terminalAddress) terminal.terminal_address = terminalAddress;
      if (terminalNote) terminal.terminal_note = terminalNote;
    }

    // Build products object
    const products: any = {};
    if (oneClickCheckoutEnabled !== undefined) {
      products.one_click_checkout = { enabled: oneClickCheckoutEnabled };
    }
    if (verifyPayEnabled !== undefined) {
      products.verify_pay = { enabled: verifyPayEnabled };
    }

    // Parse order tags if provided
    let parsedOrderTags;
    if (orderTags) {
      try {
        parsedOrderTags = JSON.parse(orderTags);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON format for order tags',
          message: 'Order tags must be valid JSON format. Example: {"product":"Laptop","city":"Bangalore"}',
        };
      }
    }

    // Prepare the request body
    const requestBody: any = {
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_id: generatedOrderId,
      customer_details: customerDetails,
    };

    // Add optional fields
    if (Object.keys(orderMeta).length > 0) requestBody.order_meta = orderMeta;
    if (Object.keys(cartDetails).length > 0) requestBody.cart_details = cartDetails;
    if (Object.keys(terminal).length > 0) requestBody.terminal = terminal;
    if (Object.keys(products).length > 0) requestBody.products = products;
    if (orderNote) requestBody.order_note = orderNote;
    if (orderExpiryTime) requestBody.order_expiry_time = orderExpiryTime;
    if (parsedOrderTags) requestBody.order_tags = parsedOrderTags;

    // Build headers - only client credentials supported
    const headers: any = {
      'x-api-version': '2025-01-01',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Id': clientId,
      'X-Client-Secret': clientSecret,
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
          message: 'Order created successfully',
        };
      } else {
        return {
          success: false,
          error: response.body,
          message: 'Failed to create order',
          status: response.status,
        };
      }
    } catch (error) {
      console.error('Error creating Cashfree order:', error);
      return {
        success: false,
        error: error,
        message: 'An error occurred while creating the order',
      };
    }
  },
});
