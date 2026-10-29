import { describe, expect, test } from 'vitest';
import { pastefy } from '../src/index';

describe('piece metadata', () => {
  const actions = Object.values(pastefy.actions());
  const triggers = Object.values(pastefy.triggers());

  test('audience counts', () => {
    const count = (audience: string) => actions.filter((a) => a.name !== 'custom_api_call' && a.audience === audience).length;
    expect({ human: count('human'), ai: count('ai'), both: count('both') }).toEqual({ human: 6, ai: 6, both: 4 });
  });

  test('every action and trigger has outputSchema and aiMetadata', () => {
    for (const action of actions.filter((a) => a.name !== 'custom_api_call')) {
      expect(action.outputSchema?.fields.length, action.name).toBeGreaterThan(0);
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
    for (const trigger of triggers) {
      expect(trigger.outputSchema?.fields.length, trigger.name).toBeGreaterThan(0);
    }
  });

  test('legacy names are kept', () => {
    const names = actions.map((a) => a.name);
    for (const name of ['create_paste', 'get_paste', 'edit_paste', 'delete_paste', 'create_folder', 'get_folder', 'get_folder_hierarchy', 'delete_folder']) {
      expect(names).toContain(name);
    }
    expect(triggers.map((t) => t.name)).toEqual(['paste_changed']);
  });

  test('ai actions take IDs as text, not dropdowns', () => {
    for (const action of actions.filter((a) => a.audience === 'ai')) {
      for (const [key, prop] of Object.entries(action.props)) {
        expect(prop.type, `${action.name}.${key}`).not.toBe('DROPDOWN');
      }
    }
  });
});
