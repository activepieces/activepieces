import { describe, expect, it } from 'vitest';
import { OutputSchemaField } from '@activepieces/pieces-framework';
import { sallaOutputSchemas } from '../src/lib/common/output-schemas';

function keysOf({ fields }: { fields: OutputSchemaField[] }): string[] {
  return fields.map((field) => field.key);
}

function listItemKeys({ fields, key }: { fields: OutputSchemaField[]; key: string }): string[] {
  const list = fields.find((field) => field.key === key);
  return keysOf({ fields: list?.listItems ?? [] });
}

describe('customer schemas', () => {
  it('keeps the stats fields on Get Customer only', () => {
    expect(keysOf(sallaOutputSchemas.customer)).toContain('orders_count');
    expect(keysOf(sallaOutputSchemas.savedCustomer)).not.toContain('orders_count');
    expect(keysOf(sallaOutputSchemas.savedCustomer)).not.toContain('wallet_balance');
    expect(keysOf(sallaOutputSchemas.savedCustomer)).toEqual(expect.arrayContaining(['id', 'full_name', 'currency']));
  });
});

describe('abandoned cart schemas', () => {
  it('lists status on cart details but not on the cart list, which Salla does not send it in', () => {
    expect(keysOf(sallaOutputSchemas.abandonedCart)).toContain('status');
    expect(listItemKeys({ fields: sallaOutputSchemas.abandonedCartList.fields, key: 'carts' })).not.toContain('status');
    expect(listItemKeys({ fields: sallaOutputSchemas.abandonedCartList.fields, key: 'carts' })).toContain('checkout_url');
  });
});
