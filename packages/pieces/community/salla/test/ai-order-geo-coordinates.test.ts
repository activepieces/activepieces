import { describe, expect, it } from 'vitest';
import { aiCreateOrderAction } from '../src/lib/actions/ai/create-order';
import { aiUpdateOrderAction } from '../src/lib/actions/ai/update-order';

describe('AI order actions say that Salla needs latitude and longitude for a shipping address', () => {
  it('Create Order marks both as required for shipping', () => {
    for (const key of ['latitude', 'longitude'] as const) {
      expect(aiCreateOrderAction.props[key].description, key).toContain('Required for shipping');
      expect(aiCreateOrderAction.props[key].description, key).not.toContain('Sent only together');
    }
    expect(aiCreateOrderAction.props.delivery_method.description).toContain('latitude and longitude');
  });

  it('Update Order marks both as required when the address changes', () => {
    for (const key of ['latitude', 'longitude'] as const) {
      expect(aiUpdateOrderAction.props[key].description, key).toContain('Required when changing the address');
      expect(aiUpdateOrderAction.props[key].description, key).not.toContain('Sent only together');
    }
  });
});
