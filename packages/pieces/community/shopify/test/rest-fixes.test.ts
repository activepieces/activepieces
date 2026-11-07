import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { adjustInventoryLevelAction } from '../src/lib/actions/adjust-inventory-level';
import { createTransactionAction } from '../src/lib/actions/create-transaction';
import { getProductsAction } from '../src/lib/actions/get-products';
import { updateProductAction } from '../src/lib/actions/update-product';
import { runAction } from './helpers';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('update_product images', () => {
    it('sends no images key when no image is attached, so Shopify keeps the current images', async () => {
        const sent = mockRest({ replies: [{ body: { product: { id: 1 } } }] });

        await runAction({ action: updateProductAction, propsValue: { id: '1', title: 'Shirt', status: 'draft' } });

        expect(sent).toHaveLength(1);
        expect(readProduct({ request: sent[0] })).not.toHaveProperty('images');
    });

    it('sends the attached image as an attachment', async () => {
        const sent = mockRest({ replies: [{ body: { product: { id: 1 } } }] });

        await runAction({
            action: updateProductAction,
            propsValue: { id: '1', status: 'draft', productImage: { filename: 'shirt.png', extension: 'png', base64: 'aW1hZ2U=' } },
        });

        expect(readProduct({ request: sent[0] })).toHaveProperty('images', [{ attachment: 'aW1hZ2U=' }]);
    });
});

describe('adjust_inventory_level', () => {
    it('returns the inventory level from the response', async () => {
        const level = { inventory_item_id: 11, location_id: 22, available: 7 };
        mockRest({ replies: [{ body: { inventory_level: level } }] });

        const result = await runAction({ action: adjustInventoryLevelAction, propsValue: { id: 11, locationId: 22, adjustment: 2 } });

        expect(result).toEqual(level);
    });
});

describe('get_products paging', () => {
    it('sends only page_info after the first page', async () => {
        const sent = mockRest({
            replies: [
                {
                    body: { products: [{ id: 1 }] },
                    headers: { link: '<https://test-shop.myshopify.com/admin/api/2026-10/products.json?page_info=next123&limit=50>; rel="next"' },
                },
                { body: { products: [{ id: 2 }] } },
            ],
        });

        const result = await runAction({ action: getProductsAction, propsValue: { title: 'Shirt' } });

        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        expect(sent[0].queryParams).toEqual({ title: 'Shirt' });
        expect(sent[1].queryParams).toEqual({ page_info: 'next123' });
    });
});

describe('create_transaction', () => {
    it('sends the authorization key', async () => {
        const sent = mockRest({ replies: [{ body: { transaction: { id: 5 } } }] });

        await runAction({ action: createTransactionAction, propsValue: { orderId: 3, kind: 'capture', authorization: 'auth-123' } });

        const body = sent[0].body;
        const transaction = isRecord(body) ? body['transaction'] : undefined;
        expect(transaction).toHaveProperty('authorization', 'auth-123');
    });
});

function mockRest({ replies }: { replies: RestReply[] }): HttpRequest[] {
    const sent: HttpRequest[] = [];
    const queue = [...replies];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
        sent.push(request);
        const reply = queue.shift();
        if (!reply) {
            throw new Error(`unexpected request: ${request.url}`);
        }
        return { status: 200, headers: reply.headers ?? {}, body: reply.body };
    });
    return sent;
}

function readProduct({ request }: { request: HttpRequest }): unknown {
    return isRecord(request.body) ? request.body['product'] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type RestReply = {
    body: Record<string, unknown>;
    headers?: Record<string, string>;
};
