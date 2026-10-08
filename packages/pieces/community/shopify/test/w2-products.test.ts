import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { shopifyAiAddProductMedia } from '../src/lib/actions/ai/add-product-media';
import { shopifyAiAdjustInventoryQuantities } from '../src/lib/actions/ai/adjust-inventory-quantities';
import { shopifyAiCreateProductVariants } from '../src/lib/actions/ai/create-product-variants';
import { shopifyAiDeleteProductMedia } from '../src/lib/actions/ai/delete-product-media';
import { shopifyAiSetInventoryQuantities } from '../src/lib/actions/ai/set-inventory-quantities';
import { shopifyAiUpdateCollection } from '../src/lib/actions/ai/update-collection';
import { shopifyAiUpdateProductVariants } from '../src/lib/actions/ai/update-product-variants';
import { mockShopify, runAction } from './helpers';

const ITEM = 'gid://shopify/InventoryItem/11';
const LOCATION = 'gid://shopify/Location/22';
const PRODUCT = 'gid://shopify/Product/1';

const SET_PROPS = {
    name: 'available',
    reason: 'correction',
    quantities: [{ inventory_item_id: '11', location_id: '22', quantity: 5 }],
    idempotency_key: 'set-1',
};

const ADJUST_PROPS = {
    name: 'available',
    reason: 'correction',
    changes: [{ inventory_item_id: '11', location_id: '22', delta: -2 }],
    idempotency_key: 'adjust-1',
};

const INVENTORY_CASES = [
    { label: 'set_inventory_quantities', action: shopifyAiSetInventoryQuantities, propsValue: SET_PROPS, mutation: 'inventorySetQuantities' },
    { label: 'adjust_inventory_quantities', action: shopifyAiAdjustInventoryQuantities, propsValue: ADJUST_PROPS, mutation: 'inventoryAdjustQuantities' },
];

afterEach(() => {
    vi.restoreAllMocks();
});

describe.each(INVENTORY_CASES)('$label stock pre-check', ({ action, propsValue, mutation }) => {
    it('refuses when the item has no inventory level at the location, without sending the mutation', async () => {
        const sent = mockShopify({ replies: [{ data: { level0: { inventoryLevel: null } } }] });

        await expect(runAction({ action, propsValue })).rejects.toThrow(`Inventory item ${ITEM} is not stocked at location ${LOCATION}`);
        expect(sent).toHaveLength(1);
        expect(sent[0].query).toContain('query CheckInventoryLevels');
        expect(sent[0].variables).toEqual({ item0: ITEM, location0: LOCATION });
    });

    it('refuses when the inventory level is inactive, without sending the mutation', async () => {
        const sent = mockShopify({ replies: [{ data: { level0: { inventoryLevel: { isActive: false } } } }] });

        await expect(runAction({ action, propsValue })).rejects.toThrow('not stocked');
        expect(sent).toHaveLength(1);
    });

    it('sends the mutation with the idempotency key when the level is active', async () => {
        const sent = mockShopify({
            replies: [
                { data: { level0: { inventoryLevel: { isActive: true } } } },
                { data: { [mutation]: { inventoryAdjustmentGroup: { id: 'gid://shopify/InventoryAdjustmentGroup/9', changes: [] }, userErrors: [] } } },
            ],
        });

        const result = await runAction({ action, propsValue });

        expect(sent).toHaveLength(2);
        expect(sent[1].query).toContain(`${mutation}(input: $input) @idempotent(key: $idempotencyKey)`);
        expect(sent[1].variables['idempotencyKey']).toBe(propsValue.idempotency_key);
        expect(result).toMatchObject({ adjustment_group_id: 'gid://shopify/InventoryAdjustmentGroup/9', idempotency_key: propsValue.idempotency_key });
    });
});

describe('inventory mutation input', () => {
    it('set_inventory_quantities sends the exact quantities input', async () => {
        const sent = mockShopify({
            replies: [
                { data: { level0: { inventoryLevel: { isActive: true } } } },
                { data: { inventorySetQuantities: { inventoryAdjustmentGroup: null, userErrors: [] } } },
            ],
        });

        await runAction({ action: shopifyAiSetInventoryQuantities, propsValue: SET_PROPS });

        expect(sent[1].variables).toEqual({
            input: {
                name: 'available',
                reason: 'correction',
                quantities: [{ inventoryItemId: ITEM, locationId: LOCATION, quantity: 5, changeFromQuantity: null }],
            },
            idempotencyKey: 'set-1',
        });
    });

    it('adjust_inventory_quantities sends the exact changes input', async () => {
        const sent = mockShopify({
            replies: [
                { data: { level0: { inventoryLevel: { isActive: true } } } },
                { data: { inventoryAdjustQuantities: { inventoryAdjustmentGroup: null, userErrors: [] } } },
            ],
        });

        await runAction({ action: shopifyAiAdjustInventoryQuantities, propsValue: ADJUST_PROPS });

        expect(sent[1].variables).toEqual({
            input: {
                name: 'available',
                reason: 'correction',
                changes: [{ inventoryItemId: ITEM, locationId: LOCATION, delta: -2, changeFromQuantity: null }],
            },
            idempotencyKey: 'adjust-1',
        });
    });
});

describe('option value parsing', () => {
    it('create_product_variants keeps an escaped comma inside a value', async () => {
        const sent = mockShopify({
            replies: [{ data: { productVariantsBulkCreate: { product: { id: PRODUCT }, productVariants: [], userErrors: [] } } }],
        });

        await runAction({
            action: shopifyAiCreateProductVariants,
            propsValue: { product_id: '1', variants: [{ option_values: 'Material=Cotton\\, Linen, Size=L' }] },
        });

        expect(sent[0].variables).toEqual({
            productId: PRODUCT,
            variants: [
                {
                    optionValues: [
                        { optionName: 'Material', name: 'Cotton, Linen' },
                        { optionName: 'Size', name: 'L' },
                    ],
                },
            ],
        });
    });
});

describe('delete_product_media', () => {
    const MEDIA_STATUS = {
        data: {
            product: {
                media: {
                    nodes: [
                        { id: 'gid://shopify/MediaImage/100', status: 'READY' },
                        { id: 'gid://shopify/MediaImage/200', status: 'FAILED' },
                    ],
                },
            },
        },
    };

    it('refuses a media id that is not on the product, deleting nothing', async () => {
        const sent = mockShopify({ replies: [MEDIA_STATUS] });

        await expect(
            runAction({ action: shopifyAiDeleteProductMedia, propsValue: { product_id: '1', media_ids: ['100', '999'] } })
        ).rejects.toThrow(`gid://shopify/MediaImage/999 is not media of product ${PRODUCT}`);
        expect(sent).toHaveLength(1);
        expect(sent[0].variables).toEqual({ id: PRODUCT });
    });

    it('deletes a FAILED media file with fileDelete', async () => {
        const sent = mockShopify({
            replies: [MEDIA_STATUS, { data: { fileDelete: { deletedFileIds: ['gid://shopify/MediaImage/200'], userErrors: [] } } }],
        });

        const result = await runAction({ action: shopifyAiDeleteProductMedia, propsValue: { product_id: '1', media_ids: ['200'] } });

        expect(sent).toHaveLength(2);
        expect(sent[1].query).toContain('fileDelete(fileIds: $fileIds)');
        expect(sent[1].variables).toEqual({ fileIds: ['gid://shopify/MediaImage/200'] });
        expect(result).toEqual({ product_id: PRODUCT, removed_media_ids: ['gid://shopify/MediaImage/200'], redacted_fields: [] });
    });

    it('detaches READY media from the product with fileUpdate referencesToRemove', async () => {
        const sent = mockShopify({
            replies: [MEDIA_STATUS, { data: { fileUpdate: { files: [{ id: 'gid://shopify/MediaImage/100' }], userErrors: [] } } }],
        });

        await runAction({ action: shopifyAiDeleteProductMedia, propsValue: { product_id: '1', media_ids: ['100'] } });

        expect(sent).toHaveLength(2);
        expect(sent[1].query).toContain('fileUpdate(files: $files)');
        expect(sent[1].variables).toEqual({ files: [{ id: 'gid://shopify/MediaImage/100', referencesToRemove: [PRODUCT] }] });
    });
});

describe('add_product_media', () => {
    it('returns only the media that were not on the product before the update', async () => {
        const sent = mockShopify({
            replies: [
                { data: { product: { media: { nodes: [{ id: 'gid://shopify/MediaImage/1' }] } } } },
                {
                    data: {
                        productUpdate: {
                            product: {
                                id: PRODUCT,
                                media: {
                                    nodes: [
                                        { id: 'gid://shopify/MediaImage/1', status: 'READY' },
                                        { id: 'gid://shopify/MediaImage/2', status: 'UPLOADED', alt: 'Front' },
                                    ],
                                },
                            },
                            userErrors: [],
                        },
                    },
                },
            ],
        });

        const result = await runAction({
            action: shopifyAiAddProductMedia,
            propsValue: { product_id: '1', media: [{ url: 'https://cdn.example.com/front.png', alt: 'Front' }] },
        });

        expect(sent[1].variables).toEqual({
            product: { id: PRODUCT },
            media: [{ originalSource: 'https://cdn.example.com/front.png', alt: 'Front', mediaContentType: 'IMAGE' }],
        });
        expect(result).toMatchObject({ product_id: PRODUCT, count: 1, media: [{ id: 'gid://shopify/MediaImage/2', alt: 'Front' }] });
    });
});

describe('update_collection', () => {
    it('refuses a rule change on a shared conditions source, without sending collectionUpdate', async () => {
        const sent = mockShopify({
            replies: [
                {
                    data: {
                        collection: {
                            id: 'gid://shopify/Collection/5',
                            sources: [
                                { __typename: 'CollectionConditionsSource', id: 'gid://shopify/CollectionConditionsSource/77', title: 'Shared rules', shareable: true },
                            ],
                        },
                    },
                },
            ],
        });

        await expect(
            runAction({ action: shopifyAiUpdateCollection, propsValue: { collection_id: '5', source_id: '77', match_type: 'ANY' } })
        ).rejects.toThrow('Source 77 ("Shared rules") is shared with other collections');
        expect(sent).toHaveLength(1);
        expect(sent[0].query).toContain('query UpdateCollectionSources');
    });
});

describe('variant barcodes', () => {
    it('update_product_variants sends the barcode with its type', async () => {
        const sent = mockShopify({
            replies: [{ data: { productVariantsBulkUpdate: { product: { id: PRODUCT }, productVariants: [], userErrors: [] } } }],
        });

        await runAction({
            action: shopifyAiUpdateProductVariants,
            propsValue: { product_id: '1', variants: [{ variant_id: '3', barcode: '4006381333931', barcode_type: 'EAN' }] },
        });

        expect(sent[0].variables).toEqual({
            productId: PRODUCT,
            variants: [{ id: 'gid://shopify/ProductVariant/3', barcodes: [{ value: '4006381333931', type: 'EAN' }] }],
        });
    });

    it('refuses barcode_type without a barcode before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({
                action: shopifyAiUpdateProductVariants,
                propsValue: { product_id: '1', variants: [{ variant_id: '3', barcode_type: 'EAN' }] },
            })
        ).rejects.toThrow('Set "barcode" when giving a barcode_type.');
        expect(sent).toHaveLength(0);
    });
});
