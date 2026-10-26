import { describe, expect, test } from 'vitest';
import { actualbudget } from '../src/index';

describe('piece metadata', () => {
  const actions = Object.values(actualbudget.actions());
  const triggers = Object.values(actualbudget.triggers());

  test('every action has an outputSchema and aiMetadata', () => {
    for (const action of actions) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
    for (const trigger of triggers) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });

  test('audiences: demoted builder actions are human, twins are ai', () => {
    expect(
      Object.fromEntries(actions.map((a) => [a.name, a.audience]))
    ).toEqual({
      get_budget: 'human',
      import_transaction: 'human',
      get_categories: 'human',
      get_accounts: 'human',
      import_transactions: 'both',
      get_budget_month: 'ai',
      add_transaction: 'ai',
      list_accounts: 'ai',
      list_categories: 'ai',
      find_payees: 'both',
      find_transactions: 'both',
      update_transaction: 'both',
      delete_transaction: 'both',
      set_budget_amount: 'both',
      run_bank_sync: 'both',
    });
  });

  test('classifications', () => {
    const cls = Object.fromEntries(
      actions.map((a) => [a.name, a.classification])
    );
    expect(cls).toMatchObject({
      get_accounts: 'READ',
      get_categories: 'READ',
      delete_transaction: 'DESTRUCTIVE',
      find_transactions: 'SEARCH',
    });
  });

  test('ai-visible actions take no dynamic dropdown props', () => {
    for (const action of actions.filter((a) => a.audience !== 'human')) {
      for (const [key, prop] of Object.entries(action.props)) {
        expect(prop.type, `${action.name}.${key}`).not.toBe('DROPDOWN');
      }
    }
  });
});
