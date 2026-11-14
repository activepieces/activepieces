import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { OutputSchemaField } from '@activepieces/pieces-framework';
import { sallaMarketing } from '../src/lib/common/marketing';
import { sallaOutputSchemas } from '../src/lib/common/output-schemas';

const auth = { access_token: 'token' };

const CART_JSON = '{"id":"1290362370","items":[{"id":4308650113630462987,"product_id":1764656014,"quantity":2}]}';

function mockText(text: string) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: text });
}

function itemsOf(cart: Record<string, unknown>): Record<string, unknown>[] {
  const items = cart['items'];
  return Array.isArray(items) ? items : [];
}

function fieldOf({ fields, key }: { fields: OutputSchemaField[]; key: string }): OutputSchemaField | undefined {
  return fields.find((field) => field.key === key);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('abandoned cart large item ids', () => {
  it('keeps every digit of the item id on Get Abandoned Cart', async () => {
    const spy = mockText(`{"status":200,"success":true,"data":${CART_JSON}}`);
    const cart = await sallaMarketing.getAbandonedCart({ auth, cartId: 1290362370 });
    expect(spy.mock.calls[0][0].responseType).toBe('text');
    expect(itemsOf(cart)[0]['id']).toBe('4308650113630462987');
    expect(itemsOf(cart)[0]['product_id']).toBe(1764656014);
  });

  it('keeps every digit of the item id on the cart list', async () => {
    const spy = mockText(`{"status":200,"success":true,"data":[${CART_JSON}],"pagination":{"currentPage":1,"totalPages":1}}`);
    const result = await sallaMarketing.listAbandonedCarts({ auth, filters: { maxResults: 10 } });
    expect(spy.mock.calls[0][0].responseType).toBe('text');
    expect(itemsOf(result.carts[0])[0]['id']).toBe('4308650113630462987');
  });

  it('does not type the cart id or the item id as numbers', () => {
    const fields = sallaOutputSchemas.abandonedCart.fields;
    expect(fieldOf({ fields, key: 'id' })?.format).toBeUndefined();
    const item = fieldOf({ fields: fieldOf({ fields, key: 'items' })?.listItems ?? [], key: 'id' });
    expect(item?.format).toBeUndefined();
    expect(item?.description).toMatch(/digits/);
  });
});
