import { describe, expect, it } from 'vitest';
import { aiUpdateOrderStatusAction } from '../src/lib/actions/ai/update-order-status';
import { updateOrderStatusAction } from '../src/lib/actions/update-order-status';

describe('Update Order Status is not idempotent', () => {
  it('marks both twins idempotent: false because a late repeat moves the order back and can text the customer again', () => {
    for (const action of [updateOrderStatusAction, aiUpdateOrderStatusAction]) {
      expect(action.aiMetadata?.idempotent, action.name).toBe(false);
      expect(action.aiMetadata?.description, action.name).not.toMatch(/is safe/);
      expect(action.aiMetadata?.description, action.name).toMatch(/do not retry/i);
      expect(action.aiMetadata?.description, action.name).not.toMatch(/log the note again/i);
      expect(action.aiMetadata?.description, action.name).toMatch(/does not save the note again/i);
    }
  });
});
