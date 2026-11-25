import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {
  extractPaymosCredentials,
  PAYMOS_DEFAULT_BASE_URL,
  PaymosClient,
  type PaymosRefundMode,
  type PaymosSandboxInvoiceStage,
} from '../common/client';

export const PAYMOS_NETWORK_DROPDOWN_OPTIONS = [
  { label: 'Arbitrum (ARBITRUM)', value: 'ARBITRUM' },
  { label: 'Avalanche (AVAX)', value: 'AVAX' },
  { label: 'Base (BASE)', value: 'BASE' },
  { label: 'BNB Smart Chain (BEP20)', value: 'BEP20' },
  { label: 'Ethereum (ERC20)', value: 'ERC20' },
  { label: 'NEAR (NEAR)', value: 'NEAR' },
  { label: 'Optimism (OPTIMISM)', value: 'OPTIMISM' },
  { label: 'Plasma (PLASMA)', value: 'PLASMA' },
  { label: 'Polygon (POLYGON)', value: 'POLYGON' },
  { label: 'Solana (SOL)', value: 'SOL' },
  { label: 'Sui (SUI)', value: 'SUI' },
  { label: 'TON (TON)', value: 'TON' },
  { label: 'Tron (TRC20)', value: 'TRC20' },
];

export const PAYMOS_INVOICE_STATUS_OPTIONS = [
  { label: 'Awaiting Client', value: 'awaiting_client' },
  { label: 'Awaiting Payment', value: 'awaiting_payment' },
  { label: 'Confirming', value: 'confirming' },
  { label: 'Underpaid Waiting', value: 'underpaid_waiting' },
  { label: 'Paid', value: 'paid' },
  { label: 'Paid Over', value: 'paid_over' },
  { label: 'Underpaid', value: 'underpaid' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const paymosAuth = PieceAuth.CustomAuth({
  displayName: 'Paymos API Credentials',
  description:
    'Connect using a Paymos Payment API key (pk_live_ for Production or pk_test_ for Sandbox) and Secret Key from Paymos Dashboard → Developer → API Keys. Payout keys (rk_) are not supported.',
  required: true,
  props: {
    publicKey: Property.ShortText({
      displayName: 'Public Key',
      description:
        'Payment API public key starting with pk_live_ (Production) or pk_test_ (Sandbox). Payout keys (rk_) are rejected.',
      required: true,
    }),
    secretKey: PieceAuth.SecretText({
      displayName: 'Secret Key',
      description:
        'Payment API secret key (sk_live_ or sk_test_) used to sign requests with HMAC-SHA256.',
      required: true,
    }),
    webhookSecret: PieceAuth.SecretText({
      displayName: 'Webhook Signing Secret',
      description:
        'Optional webhook signing secret (whsec_...) from Paymos Dashboard → Developer → Webhooks. Required when activating the Paymos Webhook Event trigger.',
      required: false,
    }),
    baseUrl: Property.ShortText({
      displayName: 'API Base URL',
      description:
        'Paymos Merchant API base URL. Keep https://api.paymos.io for both Production and Sandbox.',
      required: false,
      defaultValue: PAYMOS_DEFAULT_BASE_URL,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const credentials = extractPaymosCredentials(auth);
      const client = new PaymosClient(credentials);
      await client.validateCredentials();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Paymos API credential validation failed.',
      };
    }
  },
});

export const createInvoiceAction = createAction({
  auth: paymosAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description:
    'Create a new Paymos payment invoice in any of 45 fiat currencies or supported crypto assets (USDT, USDC, USD1, DAI, XAUT).',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'Prefixed project identifier (prj_...) that receives the invoice.',
      required: true,
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'Exact order total as a decimal string (e.g. "49.95").',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'Fiat currency code (USD, EUR, ...) or supported crypto asset symbol (USDT, USDC, USD1, DAI, XAUT).',
      required: true,
      defaultValue: 'USD',
    }),
    external_order_id: Property.ShortText({
      displayName: 'External Order ID',
      description:
        'Your unique order identifier (max 128 chars, cannot start with "wgt_") used for idempotency per project.',
      required: true,
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description:
        'Optional blockchain network to lock a crypto-denominated invoice to. Leave empty to let the payer choose.',
      required: false,
      options: {
        options: PAYMOS_NETWORK_DROPDOWN_OPTIONS,
      },
    }),
    customer_fee_percent: Property.Number({
      displayName: 'Customer Fee Percent',
      description:
        'Optional percentage of the processing fee passed to the payer (0-100), overriding the project default.',
      required: false,
    }),
    client_id: Property.ShortText({
      displayName: 'Client ID',
      description:
        'Optional merchant customer identifier (max 200 chars), echoed back on invoice reads and list items.',
      required: false,
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.createInvoice({
      project_id: context.propsValue.project_id,
      amount: context.propsValue.amount,
      currency: context.propsValue.currency,
      external_order_id: context.propsValue.external_order_id,
      network: context.propsValue.network,
      customer_fee_percent: context.propsValue.customer_fee_percent,
      client_id: context.propsValue.client_id,
    });
  },
});

export const getInvoiceAction = createAction({
  auth: paymosAuth,
  name: 'get_invoice',
  displayName: 'Get Invoice',
  description: 'Retrieve a single Paymos invoice by its identifier (inv_...).',
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Prefixed Paymos invoice identifier (inv_...).',
      required: true,
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.getInvoice(context.propsValue.invoice_id);
  },
});

export const listInvoicesAction = createAction({
  auth: paymosAuth,
  name: 'list_invoices',
  displayName: 'List Invoices',
  description:
    'List Paymos invoices with optional filters and keyset cursor pagination.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Optional project filter (prj_...).',
      required: false,
    }),
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Optional filter by one or more invoice statuses.',
      required: false,
      options: {
        options: PAYMOS_INVOICE_STATUS_OPTIONS,
      },
    }),
    external_order_id: Property.ShortText({
      displayName: 'External Order ID',
      description: 'Optional exact merchant external order identifier.',
      required: false,
    }),
    created_from: Property.Number({
      displayName: 'Created From (Unix Seconds)',
      description:
        'Optional lower bound Unix timestamp in seconds (inclusive).',
      required: false,
    }),
    created_to: Property.Number({
      displayName: 'Created To (Unix Seconds)',
      description:
        'Optional upper bound Unix timestamp in seconds (exclusive).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of invoices to return per page (1-100).',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Opaque pagination cursor from a previous List Invoices call.',
      required: false,
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.listInvoices({
      project_id: context.propsValue.project_id,
      status: context.propsValue.status,
      external_order_id: context.propsValue.external_order_id,
      created_from: context.propsValue.created_from,
      created_to: context.propsValue.created_to,
      limit: context.propsValue.limit,
      cursor: context.propsValue.cursor,
    });
  },
});

export const cancelInvoiceAction = createAction({
  auth: paymosAuth,
  name: 'cancel_invoice',
  displayName: 'Cancel Invoice',
  description:
    'Cancel an invoice while it is still awaiting client selection, recording a mandatory cancellation reason.',
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Prefixed Paymos invoice identifier (inv_...).',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description:
        'Mandatory cancellation reason stored on the invoice record (1 to 500 characters).',
      required: true,
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.cancelInvoice({
      invoice_id: context.propsValue.invoice_id,
      reason: context.propsValue.reason,
    });
  },
});

export const simulateSandboxInvoiceAction = createAction({
  auth: paymosAuth,
  name: 'simulate_sandbox_invoice',
  displayName: 'Simulate Sandbox Invoice Payment',
  description:
    'Simulate a payment lifecycle outcome on a Sandbox invoice. Requires a Sandbox key (pk_test_); Production keys (pk_live_) are rejected before calling the API.',
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Prefixed Sandbox invoice identifier (inv_...).',
      required: true,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Stage',
      description: 'Sandbox payment stage to simulate.',
      required: true,
      defaultValue: 'paid',
      options: {
        options: [
          { label: 'Paid', value: 'paid' },
          { label: 'Overpaid', value: 'overpaid' },
          { label: 'Underpay', value: 'underpay' },
          { label: 'Cancel', value: 'cancel' },
        ],
      },
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.simulateSandboxInvoice({
      invoice_id: context.propsValue.invoice_id,
      stage: context.propsValue.stage as PaymosSandboxInvoiceStage,
    });
  },
});

export const createPaymentChannelAction = createAction({
  auth: paymosAuth,
  name: 'create_payment_channel',
  displayName: 'Create Payment Channel',
  description:
    'Idempotently create or retrieve a permanent multi-network deposit channel for a customer.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'Prefixed project identifier (prj_...) that owns the payment channel.',
      required: true,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description:
        'Your stable customer identifier (max 128 chars). Repeating the same project_id and external_id returns the existing channel.',
      required: true,
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.createPaymentChannel({
      project_id: context.propsValue.project_id,
      external_id: context.propsValue.external_id,
    });
  },
});

export const getPaymentChannelAction = createAction({
  auth: paymosAuth,
  name: 'get_payment_channel',
  displayName: 'Get Payment Channel',
  description:
    'Retrieve a Payment Channel by ID (pch_...) with its provisioned network deposit addresses and minimums.',
  props: {
    channel_id: Property.ShortText({
      displayName: 'Payment Channel ID',
      description: 'Prefixed Payment Channel identifier (pch_...).',
      required: true,
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.getPaymentChannel(context.propsValue.channel_id);
  },
});

export const createRefundAction = createAction({
  auth: paymosAuth,
  name: 'create_refund',
  displayName: 'Create Refund',
  description:
    'Create a server-calculated full or overpayment refund back to the first saved sender of a paid invoice. Amount, asset, network, and destination address are calculated server-side.',
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Prefixed Paymos invoice identifier (inv_...) to refund.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Refund Mode',
      description:
        'Server-calculated refund mode: full invoice refund or overpayment excess only.',
      required: true,
      defaultValue: 'full',
      options: {
        options: [
          { label: 'Full', value: 'full' },
          { label: 'Overpayment', value: 'overpayment' },
        ],
      },
    }),
    external_order_id: Property.ShortText({
      displayName: 'External Order ID',
      description: 'Your unique idempotency key for this refund request.',
      required: true,
    }),
  },
  async run(context) {
    const client = new PaymosClient(extractPaymosCredentials(context.auth));
    return client.createRefund({
      invoice_id: context.propsValue.invoice_id,
      mode: context.propsValue.mode as PaymosRefundMode,
      external_order_id: context.propsValue.external_order_id,
    });
  },
});

export const paymosActions = [
  createInvoiceAction,
  getInvoiceAction,
  listInvoicesAction,
  cancelInvoiceAction,
  simulateSandboxInvoiceAction,
  createPaymentChannelAction,
  getPaymentChannelAction,
  createRefundAction,
];
