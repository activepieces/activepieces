import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { shopifyAiCountCustomers } from '../src/lib/actions/ai/count-customers';
import { shopifyAiCreateOrderWithLineItems } from '../src/lib/actions/ai/create-order-with-line-items';
import { shopifyAiResolveRequestedOrderEdit } from '../src/lib/actions/ai/resolve-requested-order-edit';
import { shopifyAiSendPaymentMethodUpdateEmail } from '../src/lib/actions/ai/send-payment-method-update-email';
import { shopifyAiUpdateCustomerProfile } from '../src/lib/actions/ai/update-customer-profile';
import { shopifyGraphqlClient } from '../src/lib/common/graphql';
import { GRAPHQL_URL, mockShopify, runAction, TEST_AUTH } from './helpers';

const PROTECTED_DENIAL = {
    message: 'This app is not approved to access the Order object. See https://shopify.dev/docs/apps/launch/protected-customer-data for more details.',
    path: ['orderCreate', 'order'],
    extensions: { code: 'ACCESS_DENIED' },
};

const SEARCH_WARNING = {
    search: [{ path: ['customersCount'], query: 'tag:vip', warnings: [{ field: 'tag', message: 'Invalid search field for this query.' }] }],
};

const CREATED_ORDER = { orderCreate: { order: { id: 'gid://shopify/Order/1', name: '#1001' }, userErrors: [] } };

const LINE_ITEM = [{ variant_id: '111', quantity: 2 }];

afterEach(() => {
    vi.restoreAllMocks();
});

describe('shopifyGraphqlClient.request', () => {
    it('POSTs the query and variables to the shop GraphQL endpoint with the admin token', async () => {
        const sent = mockShopify({ replies: [{ data: { shop: { id: 'gid://shopify/Shop/1' } } }] });

        await shopifyGraphqlClient.request({ auth: TEST_AUTH, query: 'query { shop { id } }', variables: { a: 1 } });

        expect(sent).toHaveLength(1);
        expect(sent[0].request.method).toBe('POST');
        expect(sent[0].request.url).toBe(GRAPHQL_URL);
        expect(sent[0].request.headers).toEqual({ 'X-Shopify-Access-Token': 'shpat_test', 'Content-Type': 'application/json' });
        expect(sent[0].request.body).toEqual({ query: 'query { shop { id } }', variables: { a: 1 } });
    });

    it('throws when Shopify reports a search warning instead of returning every record', async () => {
        mockShopify({ replies: [{ data: { customersCount: { count: 4120, precision: 'EXACT' } }, extensions: SEARCH_WARNING }] });

        await expect(
            shopifyGraphqlClient.request({
                auth: TEST_AUTH,
                query: 'query Count($query: String) { customersCount(query: $query) { count } }',
                variables: { query: 'tag:vip' },
            })
        ).rejects.toThrow('Shopify ignored part of the search query "tag:vip" (tag: Invalid search field for this query.)');
    });

    it('reports a withheld mutation result as applied, without a retry hint, when an idempotency key was used', async () => {
        const sent = mockShopify({ replies: [{ data: { orderCreate: { order: null, userErrors: [] } }, errors: [PROTECTED_DENIAL] }] });

        const message = await shopifyGraphqlClient
            .request({
                auth: TEST_AUTH,
                query: 'mutation CreateOrder($order: OrderCreateOrderInput!) { orderCreate(order: $order) { order { id } } }',
                variables: { order: { lineItems: [] } },
                primaryPaths: ['orderCreate.order'],
                idempotencyKey: 'key-123',
            })
            .then(
                () => 'resolved',
                (e: Error) => e.message
            );

        expect(sent[0].variables).toEqual({ order: { lineItems: [] }, idempotencyKey: 'key-123' });
        expect(message.startsWith('Shopify APPLIED this change')).toBe(true);
        expect(message).toContain('(orderCreate.order)');
        expect(message).toContain('[idempotency_key used: key-123.]');
        expect(message).not.toContain('Retry with this same idempotency_key');
    });

    it('keeps the retry hint on an ordinary failure with an idempotency key', async () => {
        mockShopify({ replies: [{ data: null, errors: [{ message: 'Internal error' }] }] });

        await expect(
            shopifyGraphqlClient.request({
                auth: TEST_AUTH,
                query: 'mutation M { orderCreate { order { id } } }',
                idempotencyKey: 'key-9',
            })
        ).rejects.toThrow('Retry with this same idempotency_key');
    });

    it('treats a protected-data denial on a non-primary path of a query as a redaction', async () => {
        mockShopify({
            replies: [
                {
                    data: { order: { id: 'gid://shopify/Order/1', customer: null } },
                    errors: [{ ...PROTECTED_DENIAL, path: ['order', 'customer'] }],
                },
            ],
        });

        const result = await shopifyGraphqlClient.request({ auth: TEST_AUTH, query: 'query { order(id: "x") { id customer { id } } }' });

        expect(result.redactedFields).toEqual(['order.customer']);
    });
});

describe('count_customers', () => {
    it('sends the filter and refuses a result where Shopify ignored the tag filter', async () => {
        const sent = mockShopify({ replies: [{ data: { customersCount: { count: 4120, precision: 'EXACT' } }, extensions: SEARCH_WARNING }] });

        await expect(runAction({ action: shopifyAiCountCustomers, propsValue: { query: 'tag:vip' } })).rejects.toThrow(
            'Shopify ignored part of the search query'
        );
        expect(sent[0].variables).toEqual({ query: 'tag:vip' });
    });

    it('returns the count when Shopify accepts the filter', async () => {
        mockShopify({ replies: [{ data: { customersCount: { count: 7, precision: 'EXACT' } } }] });

        const result = await runAction({ action: shopifyAiCountCustomers, propsValue: { query: 'created_at:>2026-01-01' } });

        expect(result).toEqual({ count: 7, precision: 'EXACT', redacted_fields: [] });
    });
});

describe('create_order_with_line_items', () => {
    it('refuses financial_status PAID without payment_amount before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({
                action: shopifyAiCreateOrderWithLineItems,
                propsValue: { line_items: LINE_ITEM, currency: 'USD', financial_status: 'PAID' },
            })
        ).rejects.toThrow('Set "payment_amount" (greater than 0) with financial_status PAID');
        expect(sent).toHaveLength(0);
    });

    it('records a manual SALE transaction for a PAID order', async () => {
        const sent = mockShopify({ replies: [{ data: CREATED_ORDER }] });

        await runAction({
            action: shopifyAiCreateOrderWithLineItems,
            propsValue: { line_items: LINE_ITEM, currency: 'usd', financial_status: 'PAID', payment_amount: 10 },
        });

        expect(sent).toHaveLength(1);
        expect(sent[0].variables).toEqual({
            order: {
                transactions: [
                    { kind: 'SALE', status: 'SUCCESS', gateway: 'manual', amountSet: { shopMoney: { amount: '10', currencyCode: 'USD' } } },
                ],
                lineItems: [{ variantId: 'gid://shopify/ProductVariant/111', quantity: 2 }],
                currency: 'USD',
                financialStatus: 'PAID',
            },
            options: { sendReceipt: false, sendFulfillmentReceipt: false },
        });
    });

    it('records an AUTHORIZATION transaction for an AUTHORIZED order', async () => {
        const sent = mockShopify({ replies: [{ data: CREATED_ORDER }] });

        await runAction({
            action: shopifyAiCreateOrderWithLineItems,
            propsValue: { line_items: LINE_ITEM, currency: 'USD', financial_status: 'AUTHORIZED', payment_amount: 25.5 },
        });

        const order = sent[0].variables['order'];
        expect(order).toMatchObject({
            transactions: [
                { kind: 'AUTHORIZATION', status: 'SUCCESS', gateway: 'manual', amountSet: { shopMoney: { amount: '25.5', currencyCode: 'USD' } } },
            ],
            financialStatus: 'AUTHORIZED',
        });
    });

    it('creates an imported order fulfilled from a location with tracking numbers', async () => {
        const sent = mockShopify({ replies: [{ data: CREATED_ORDER }] });

        await runAction({
            action: shopifyAiCreateOrderWithLineItems,
            propsValue: {
                line_items: LINE_ITEM,
                fulfillment_location_id: '555',
                tracking_numbers: ['1Z1', '1Z2'],
                tracking_company: 'UPS',
            },
        });

        expect(sent[0].variables).toEqual({
            order: {
                fulfillment: {
                    locationId: 'gid://shopify/Location/555',
                    trackingNumbers: ['1Z1', '1Z2'],
                    trackingCompany: 'UPS',
                    notifyCustomer: false,
                },
                fulfillmentStatus: 'FULFILLED',
                lineItems: [{ variantId: 'gid://shopify/ProductVariant/111', quantity: 2 }],
            },
            options: { sendReceipt: false, sendFulfillmentReceipt: false },
        });
    });

    it('refuses tracking numbers without a fulfillment location before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiCreateOrderWithLineItems, propsValue: { line_items: LINE_ITEM, tracking_numbers: ['1Z1'] } })
        ).rejects.toThrow('Set "fulfillment_location_id" when giving tracking numbers');
        expect(sent).toHaveLength(0);
    });
});

describe('send_payment_method_update_email', () => {
    it('sends the numeric order id as the mandate resource id', async () => {
        const sent = mockShopify({
            replies: [{ data: { paymentInstrumentSendAddEmail: { customer: { id: 'gid://shopify/Customer/9' }, userErrors: [] } } }],
        });

        const result = await runAction({
            action: shopifyAiSendPaymentMethodUpdateEmail,
            propsValue: { resource_type: 'ORDERS', resource_id: 'gid://shopify/Order/123' },
        });

        expect(sent[0].variables).toEqual({ mandate: { resourceType: 'ORDERS', resourceId: '123' } });
        expect(result).toEqual({
            customer_id: 'gid://shopify/Customer/9',
            resource_type: 'ORDERS',
            resource_id: '123',
            redacted_fields: [],
        });
    });

    it('refuses an Order id for DRAFT_ORDERS before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({
                action: shopifyAiSendPaymentMethodUpdateEmail,
                propsValue: { resource_type: 'DRAFT_ORDERS', resource_id: 'gid://shopify/Order/123' },
            })
        ).rejects.toThrow('is an Order id, but resource type DRAFT_ORDERS needs a DraftOrder id');
        expect(sent).toHaveLength(0);
    });
});

describe('resolve_requested_order_edit', () => {
    it('refuses an Order id before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiResolveRequestedOrderEdit, propsValue: { requested_order_edit_id: 'gid://shopify/Order/1' } })
        ).rejects.toThrow('requested_order_edit_id "gid://shopify/Order/1" is not a RequestedOrderEdit id');
        expect(sent).toHaveLength(0);
    });
});

describe('update_customer_profile', () => {
    const UPDATED = { data: { customerUpdate: { customer: { id: 'gid://shopify/Customer/7' }, userErrors: [] } } };

    it('sends an empty note when clear_note is set', async () => {
        const sent = mockShopify({ replies: [UPDATED] });

        await runAction({ action: shopifyAiUpdateCustomerProfile, propsValue: { customer_id: '7', clear_note: true } });

        expect(sent[0].variables).toEqual({ input: { id: 'gid://shopify/Customer/7', note: '' } });
    });

    it('sends empty tags when clear_tags is set', async () => {
        const sent = mockShopify({ replies: [UPDATED] });

        await runAction({ action: shopifyAiUpdateCustomerProfile, propsValue: { customer_id: '7', clear_tags: true } });

        expect(sent[0].variables).toEqual({ input: { id: 'gid://shopify/Customer/7', tags: [] } });
    });

    it('keeps the note when an empty note is given without clear_note', async () => {
        const sent = mockShopify({ replies: [UPDATED] });

        await runAction({ action: shopifyAiUpdateCustomerProfile, propsValue: { customer_id: '7', note: '', first_name: 'Ada' } });

        expect(sent[0].variables).toEqual({ input: { id: 'gid://shopify/Customer/7', firstName: 'Ada' } });
    });

    it('accepts an empty note together with clear_note', async () => {
        const sent = mockShopify({ replies: [UPDATED] });

        await runAction({ action: shopifyAiUpdateCustomerProfile, propsValue: { customer_id: '7', note: '', clear_note: true } });

        expect(sent[0].variables).toEqual({ input: { id: 'gid://shopify/Customer/7', note: '' } });
    });

    it('refuses a note together with clear_note before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiUpdateCustomerProfile, propsValue: { customer_id: '7', note: 'VIP', clear_note: true } })
        ).rejects.toThrow('Give either note or clear_note, not both');
        expect(sent).toHaveLength(0);
    });

    it('refuses an update with no fields before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(runAction({ action: shopifyAiUpdateCustomerProfile, propsValue: { customer_id: '7' } })).rejects.toThrow(
            'Provide at least one field to update.'
        );
        expect(sent).toHaveLength(0);
    });
});
