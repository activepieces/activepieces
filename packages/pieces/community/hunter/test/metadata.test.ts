import { describe, expect, test } from 'vitest';
import { hunter } from '../src/index';

describe('piece metadata', () => {
  const actions = Object.values(hunter.actions());
  const triggers = Object.values(hunter.triggers());

  test('every action except Custom API Call has an outputSchema and aiMetadata', () => {
    for (const action of actions.filter((a) => a.name !== 'custom_api_call')) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
  });

  test('every trigger has an outputSchema and aiMetadata', () => {
    for (const trigger of triggers) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
    }
  });

  test('audiences: dropdown actions are human, their twins are ai', () => {
    const audience = Object.fromEntries(actions.map((a) => [a.name, a.audience]));
    expect(audience).toEqual({
      'add-recipients': 'human',
      'get-lead': 'human',
      'update-lead': 'human',
      'delete-lead': 'human',
      add_campaign_recipients_by_id: 'ai',
      get_lead_by_id: 'ai',
      update_lead_by_id: 'ai',
      delete_lead_by_id: 'ai',
      'count-emails': 'both',
      'create-lead': 'both',
      'find-email': 'both',
      'search-leads': 'both',
      'verify-email': 'both',
      domain_search: 'both',
      upsert_lead: 'both',
      list_leads_lists: 'both',
      get_leads_list: 'both',
      create_leads_list: 'both',
      list_campaigns: 'both',
      remove_campaign_recipients: 'both',
      get_account: 'both',
      enrich_person_and_company: 'both',
      enrich_company: 'both',
      custom_api_call: 'human',
    });
  });

  test('ai-visible actions take no required dropdown props', () => {
    for (const action of actions.filter((a) => a.audience !== 'human')) {
      for (const [key, prop] of Object.entries(action.props)) {
        const type = Reflect.get(Object(prop), 'type');
        const required = Reflect.get(Object(prop), 'required');
        if (type === 'DROPDOWN' || type === 'MULTI_SELECT_DROPDOWN') {
          expect(required, `${action.name}.${key}`).toBe(false);
        }
      }
    }
  });
});
