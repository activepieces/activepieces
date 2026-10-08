import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { shopifyAiCreateGiftCard } from '../src/lib/actions/ai/create-gift-card';
import { shopifyAiDeleteDiscountRedeemCodes } from '../src/lib/actions/ai/delete-discount-redeem-codes';
import { shopifyAiGetFulfillmentOrder } from '../src/lib/actions/ai/get-fulfillment-order';
import { shopifyAiListDeliveryZones } from '../src/lib/actions/ai/list-delivery-zones';
import { shopifyAiListDiscountRedeemCodes } from '../src/lib/actions/ai/list-discount-redeem-codes';
import { shopifyAiUpdateGiftCard } from '../src/lib/actions/ai/update-gift-card';
import { mockShopify, runAction } from './helpers';

const DISCOUNT = 'gid://shopify/DiscountCodeNode/42';
const GIFT_CARD_CODE = 'GC7Q2M9X4K1P8Z3W';

const GIFT_CARD_DENIAL = {
    message: 'This app is not approved to access the GiftCard object. See https://shopify.dev/docs/apps/launch/protected-customer-data for more details.',
    path: ['giftCardCreate', 'giftCard'],
    extensions: { code: 'ACCESS_DENIED' },
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('discount redeem code search', () => {
    it('delete_discount_redeem_codes refuses a field filter before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiDeleteDiscountRedeemCodes, propsValue: { discount_id: DISCOUNT, search: 'code:X' } })
        ).rejects.toThrow('Shopify ignores other filters such as "code:"');
        expect(sent).toHaveLength(0);
    });

    it('list_discount_redeem_codes refuses a field filter before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiListDiscountRedeemCodes, propsValue: { discount_id: DISCOUNT, query: 'code:X' } })
        ).rejects.toThrow('Shopify ignores other filters such as "code:"');
        expect(sent).toHaveLength(0);
    });

    it('delete_discount_redeem_codes sends a supported times_used search', async () => {
        const sent = mockShopify({
            replies: [{ data: { discountCodeRedeemCodeBulkDelete: { job: { id: 'gid://shopify/Job/1', done: false }, userErrors: [] } } }],
        });

        const result = await runAction({
            action: shopifyAiDeleteDiscountRedeemCodes,
            propsValue: { discount_id: '42', search: 'times_used:0' },
        });

        expect(sent[0].variables).toEqual({ discountId: DISCOUNT, search: 'times_used:0' });
        expect(result).toEqual({ discount_id: DISCOUNT, job_id: 'gid://shopify/Job/1', done: false, redacted_fields: [] });
    });
});

describe('create_gift_card', () => {
    it('returns the gift card code with a warning when Shopify withholds the gift card record', async () => {
        const sent = mockShopify({
            replies: [
                {
                    data: { giftCardCreate: { giftCard: null, giftCardCode: GIFT_CARD_CODE, userErrors: [] } },
                    errors: [GIFT_CARD_DENIAL],
                },
            ],
        });

        const result = await runAction({ action: shopifyAiCreateGiftCard, propsValue: { amount: 25, currency: 'usd' } });

        expect(sent[0].variables).toEqual({ input: { initialAmount: { amount: '25', currencyCode: 'USD' } } });
        expect(result).toMatchObject({
            id: null,
            gift_card_code: GIFT_CARD_CODE,
            redacted_fields: ['giftCardCreate.giftCard'],
        });
        expect(result).toHaveProperty('warning', expect.stringContaining('Shopify CREATED the gift card'));
    });

    it('does not put the gift card code into the error when Shopify rejects the request', async () => {
        mockShopify({
            replies: [
                {
                    data: {
                        giftCardCreate: {
                            giftCard: null,
                            giftCardCode: GIFT_CARD_CODE,
                            userErrors: [{ field: ['input', 'customerId'], message: 'Customer does not exist', code: 'INVALID' }],
                        },
                    },
                },
            ],
        });

        const error = await runAction({ action: shopifyAiCreateGiftCard, propsValue: { amount: 25, currency: 'USD', customer_id: '9' } }).catch(
            (e: Error) => e
        );

        expect(error).toBeInstanceOf(Error);
        expect(String(error)).toContain('Customer does not exist');
        expect(String(error)).not.toContain(GIFT_CARD_CODE);
    });

    it('does not put the gift card code into the error when neither the card nor the code is returned', async () => {
        mockShopify({ replies: [{ data: { giftCardCreate: { giftCard: null, giftCardCode: null, userErrors: [] } }, errors: [GIFT_CARD_DENIAL] }] });

        const error = await runAction({ action: shopifyAiCreateGiftCard, propsValue: { amount: 25, currency: 'USD', code: GIFT_CARD_CODE } }).catch(
            (e: Error) => e
        );

        expect(String(error)).toContain('Shopify CREATED the gift card');
        expect(String(error)).not.toContain(GIFT_CARD_CODE);
    });
});

describe('get_fulfillment_order', () => {
    it('pages line items with $lineItemsAfter and returns the next cursor', async () => {
        const sent = mockShopify({
            replies: [
                {
                    data: {
                        fulfillmentOrder: {
                            id: 'gid://shopify/FulfillmentOrder/3',
                            status: 'OPEN',
                            lineItems: {
                                pageInfo: { hasNextPage: true, endCursor: 'cursor-2' },
                                nodes: [{ id: 'gid://shopify/FulfillmentOrderLineItem/1', totalQuantity: 1, remainingQuantity: 1 }],
                            },
                        },
                    },
                },
            ],
        });

        const result = await runAction({
            action: shopifyAiGetFulfillmentOrder,
            propsValue: { fulfillment_order_id: '3', line_items_after: 'cursor-1' },
        });

        expect(sent[0].query).toContain('lineItems(first: 50, after: $lineItemsAfter)');
        expect(sent[0].variables).toEqual({ id: 'gid://shopify/FulfillmentOrder/3', lineItemsAfter: 'cursor-1' });
        expect(result).toMatchObject({ id: 'gid://shopify/FulfillmentOrder/3', line_items_truncated: true, line_items_end_cursor: 'cursor-2' });
    });
});

describe('date validation', () => {
    it('update_gift_card refuses an impossible expires_on date before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiUpdateGiftCard, propsValue: { gift_card_id: '5', expires_on: '2026-02-31' } })
        ).rejects.toThrow('"2026-02-31" is not a real date in the form YYYY-MM-DD');
        expect(sent).toHaveLength(0);
    });

    it('update_gift_card sends a real expires_on date', async () => {
        const sent = mockShopify({ replies: [{ data: { giftCardUpdate: { giftCard: { id: 'gid://shopify/GiftCard/5' }, userErrors: [] } } }] });

        await runAction({ action: shopifyAiUpdateGiftCard, propsValue: { gift_card_id: '5', expires_on: '2028-02-29' } });

        expect(sent[0].variables).toEqual({ id: 'gid://shopify/GiftCard/5', input: { expiresOn: '2028-02-29' } });
    });
});

describe('list_delivery_zones', () => {
    const PROPS = { profile_id: '1', location_group_id: '2' };

    it('explains when the location group is not part of the profile', async () => {
        mockShopify({ replies: [{ data: { deliveryProfile: { id: 'gid://shopify/DeliveryProfile/1', profileLocationGroups: [] } } }] });

        await expect(runAction({ action: shopifyAiListDeliveryZones, propsValue: PROPS })).rejects.toThrow(
            'Location group gid://shopify/DeliveryLocationGroup/2 is not part of delivery profile gid://shopify/DeliveryProfile/1'
        );
    });

    it('maps the zones of the location group', async () => {
        const sent = mockShopify({
            replies: [
                {
                    data: {
                        deliveryProfile: {
                            id: 'gid://shopify/DeliveryProfile/1',
                            profileLocationGroups: [
                                {
                                    locationGroupZones: {
                                        pageInfo: { hasNextPage: false, endCursor: 'z1' },
                                        edges: [
                                            {
                                                cursor: 'c7',
                                                node: {
                                                zone: {
                                                    id: 'gid://shopify/DeliveryZone/7',
                                                    name: 'Domestic',
                                                    countries: [{ name: 'Canada', code: { countryCode: 'CA', restOfWorld: false } }],
                                                },
                                                methodDefinitions: {
                                                    pageInfo: { hasNextPage: false },
                                                    nodes: [
                                                        {
                                                            id: 'gid://shopify/DeliveryMethodDefinition/8',
                                                            name: 'Standard',
                                                            active: true,
                                                            rateProvider: { __typename: 'DeliveryRateDefinition', price: { amount: '5.0', currencyCode: 'CAD' } },
                                                        },
                                                    ],
                                                },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        });

        const result = await runAction({ action: shopifyAiListDeliveryZones, propsValue: PROPS });

        expect(sent[0].variables).toEqual({
            id: 'gid://shopify/DeliveryProfile/1',
            locationGroupId: 'gid://shopify/DeliveryLocationGroup/2',
            first: 10,
        });
        expect(result).toEqual({
            profile_id: 'gid://shopify/DeliveryProfile/1',
            location_group_id: 'gid://shopify/DeliveryLocationGroup/2',
            items: [
                {
                    zone_id: 'gid://shopify/DeliveryZone/7',
                    zone_name: 'Domestic',
                    countries: ['CA'],
                    rates: [
                        {
                            id: 'gid://shopify/DeliveryMethodDefinition/8',
                            name: 'Standard',
                            active: true,
                            description: null,
                            price: '5.0',
                            currency_code: 'CAD',
                            carrier_service_id: null,
                            carrier_service_name: null,
                        },
                    ],
                    rates_truncated: false,
                    rates_end_cursor: null,
                    zone_token: 'first',
                },
            ],
            count: 1,
            has_next_page: false,
            end_cursor: 'z1',
            redacted_fields: [],
        });
    });

    it('reads the next rates of one zone with zone_token and rates_after', async () => {
        const sent = mockShopify({
            replies: [
                {
                    data: {
                        deliveryProfile: {
                            id: 'gid://shopify/DeliveryProfile/1',
                            profileLocationGroups: [
                                {
                                    locationGroupZones: {
                                        pageInfo: { hasNextPage: true, endCursor: 'c9' },
                                        edges: [
                                            {
                                                cursor: 'c9',
                                                node: {
                                                    zone: { id: 'gid://shopify/DeliveryZone/9', name: 'EU', countries: [] },
                                                    methodDefinitions: { pageInfo: { hasNextPage: false, endCursor: 'r2' }, nodes: [] },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        });

        const result = await runAction({
            action: shopifyAiListDeliveryZones,
            propsValue: { ...PROPS, zone_token: 'c8', rates_after: 'r1' },
        });

        expect(sent[0].variables).toEqual({
            id: 'gid://shopify/DeliveryProfile/1',
            locationGroupId: 'gid://shopify/DeliveryLocationGroup/2',
            first: 1,
            after: 'c8',
            ratesAfter: 'r1',
        });
        expect(result).toMatchObject({ count: 1, has_next_page: false, end_cursor: null, items: [{ zone_id: 'gid://shopify/DeliveryZone/9', zone_token: 'c8', rates_end_cursor: 'r2' }] });
    });

    it('accepts a page size up to 25 but fetches at most 10 zones per call', async () => {
        const sent = mockShopify({
            replies: [{ data: { deliveryProfile: { id: 'gid://shopify/DeliveryProfile/1', profileLocationGroups: [{ locationGroupZones: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } }] } } }],
        });

        await runAction({ action: shopifyAiListDeliveryZones, propsValue: { ...PROPS, first: 25 } });

        expect(sent[0].variables).toMatchObject({ first: 10 });
    });

    it('refuses rates_after without zone_token before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiListDeliveryZones, propsValue: { ...PROPS, rates_after: 'r1' } })
        ).rejects.toThrow('Set zone_token together with rates_after');
        expect(sent).toHaveLength(0);
    });
});
