import { describe, expect, it } from 'vitest';
import { salla } from '../src/index';

function isOptionalCheckbox(prop: unknown): boolean {
  if (typeof prop !== 'object' || prop === null || !('type' in prop) || prop.type !== 'CHECKBOX') {
    return false;
  }
  return !('required' in prop) || prop.required !== true;
}

describe('salla piece', () => {
  const actions = Object.values(salla.actions());
  const triggers = Object.values(salla.triggers());
  const handWritten = actions.filter((action) => action.name !== 'custom_api_call');

  it('loads every action and trigger at module load', () => {
    expect(actions.length).toBe(56);
    expect(triggers.length).toBe(14);
  });

  it('gives every hand-written action an audience, a classification, aiMetadata and an output schema', () => {
    for (const action of handWritten) {
      expect(action.audience, action.name).toMatch(/^(human|ai|both)$/);
      expect(action.classification, action.name).toMatch(/^(READ|SEARCH|WRITE|DESTRUCTIVE)$/);
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.outputSchema, action.name).toBeDefined();
    }
  });

  it('gives every trigger a READ classification, aiMetadata, sample data and an output schema', () => {
    for (const trigger of triggers) {
      expect(trigger.classification, trigger.name).toBe('READ');
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
      expect(trigger.sampleData, trigger.name).toBeDefined();
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });

  it('prefixes every ai action name with ai_', () => {
    for (const action of handWritten.filter((entry) => entry.audience === 'ai')) {
      expect(action.name, action.name).toMatch(/^ai_/);
    }
  });

  it('never gives an ai action the display name of a both action', () => {
    const bothNames = new Set(handWritten.filter((action) => action.audience === 'both').map((action) => action.displayName));
    const clashes = handWritten.filter((action) => action.audience === 'ai' && bothNames.has(action.displayName)).map((action) => action.name);
    expect(clashes).toEqual([]);
  });

  it('keeps destructive steps in their own actions', () => {
    const destructive = handWritten.filter((action) => action.classification === 'DESTRUCTIVE').map((action) => action.name).sort();
    expect(destructive).toEqual(['cancel_order', 'delete_product']);
  });

  it('puts no optional checkbox on an update action', () => {
    const offenders: string[] = [];
    for (const action of handWritten.filter((entry) => /update|change|adjust|set/i.test(entry.name))) {
      for (const [key, prop] of Object.entries(action.props)) {
        if (isOptionalCheckbox(prop)) {
          offenders.push(`${action.name}.${key}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
