import { describe, expect, it } from 'vitest';
import { arteemis } from '../src';

const actions = Object.values(arteemis.actions());
const triggers = Object.values(arteemis.triggers());

describe('piece metadata', () => {
  it('has the six actions of the other hubs and the custom API call', () => {
    expect(actions.map((action) => action.name).sort()).toEqual([
      'add_contact_to_list',
      'add_or_move_contact_in_pipeline',
      'create_or_update_contact',
      'create_task',
      'custom_api_call',
      'enroll_contact_in_campaign',
      'find_contact',
    ]);
  });

  it.each(actions.filter((action) => action.name !== 'custom_api_call').map((action) => [action.name, action]))(
    '%s carries its audience, AI metadata and classification',
    (_name, action) => {
      expect(action.audience).toBe('both');
      expect(action.aiMetadata?.description?.length).toBeGreaterThan(40);
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      expect(['READ', 'SEARCH', 'WRITE']).toContain(action.classification);
    }
  );

  it.each(triggers.map((trigger) => [trigger.name, trigger]))('%s is a READ webhook trigger with AI metadata and sample data', (_name, trigger) => {
    expect(trigger.classification).toBe('READ');
    expect(trigger.type).toBe('WEBHOOK');
    expect(trigger.aiMetadata?.description?.length).toBeGreaterThan(40);
    expect(trigger.sampleData).toMatchObject({ event_id: expect.any(String), event_type: expect.any(String) });
  });
});
