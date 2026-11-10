import { describe, expect, test } from 'vitest';
import { square } from '../src';
import { SQUARE_SCOPES } from '../src/lib/auth';

const actions = Object.values(square.actions());
const handWritten = actions.filter((action) => action.name !== 'custom_api_call');
const triggers = Object.values(square.triggers());

describe('piece metadata', () => {
  test('38 actions plus custom API call, 5 triggers with unchanged names', () => {
    expect(handWritten).toHaveLength(38);
    expect(actions.map((action) => action.name)).toContain('custom_api_call');
    expect(triggers.map((trigger) => trigger.name).sort()).toEqual(['customer_updated', 'new_customer', 'new_order', 'new_payment', 'order_updated']);
  });

  test.each(handWritten.map((action) => [action.name, action]))('%s declares audience, classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['both', 'ai', 'human']).toContain(action.audience);
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(60);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });

  test('agent-visible actions have no dynamic dropdowns', () => {
    for (const action of handWritten.filter((item) => item.audience !== 'human')) {
      const types = Object.values(action.props).map((prop: unknown) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
      expect(types, action.name).not.toContain('DROPDOWN');
      expect(types, action.name).not.toContain('DYNAMIC');
    }
  });

  test('every human dropdown action has an ai twin', () => {
    const names = new Set(handWritten.map((action) => action.name));
    const humanOnly = handWritten.filter((action) => action.audience === 'human' && action.name !== 'refund_payment');
    for (const action of humanOnly) {
      expect(names.has(`${action.name}_by_id`), action.name).toBe(true);
    }
  });

  test('refund is human only and destructive', () => {
    const refund = handWritten.find((action) => action.name === 'refund_payment');
    expect(refund?.audience).toBe('human');
    expect(refund?.classification).toBe('DESTRUCTIVE');
    expect(handWritten.some((action) => action.name.startsWith('refund_payment_'))).toBe(false);
  });

  test('no action charges a card', () => {
    for (const action of handWritten) {
      expect(JSON.stringify(action.props)).not.toMatch(/source_id|card_nonce|card on file/i);
    }
  });

  test('triggers are READ with aiMetadata and an output schema', () => {
    for (const trigger of triggers) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
      expect(trigger.outputSchema?.fields.length).toBeGreaterThan(0);
    }
  });

  test('scopes', () => {
    expect(SQUARE_SCOPES).toEqual([
      'MERCHANT_PROFILE_READ', 'CUSTOMERS_READ', 'CUSTOMERS_WRITE', 'ITEMS_READ', 'ITEMS_WRITE', 'ORDERS_READ', 'ORDERS_WRITE', 'PAYMENTS_READ',
      'PAYMENTS_WRITE', 'INVENTORY_READ', 'INVENTORY_WRITE', 'EMPLOYEES_READ',
    ]);
  });
});

test('no invoice or appointment steps ship', () => {
  for (const step of [...handWritten, ...triggers]) {
    expect(step.name, step.name).not.toMatch(/invoice|booking|appointment|availability/);
  }
});
