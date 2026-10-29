import { describe, expect, test } from 'vitest';
import { sendIt } from '../src/index';

describe('piece metadata', () => {
  const actions = Object.values(sendIt.actions());
  const triggers = Object.values(sendIt.triggers());

  test('every action except Custom API Call has an outputSchema and aiMetadata', () => {
    for (const action of actions.filter((a) => a.name !== 'custom_api_call')) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
  });

  test('every trigger has an outputSchema', () => {
    for (const trigger of triggers) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });

  test('audiences: dropdown actions are human, their twins are ai', () => {
    const audience = Object.fromEntries(actions.map((a) => [a.name, a.audience]));
    expect(audience).toMatchObject({
      cancel_scheduled_post: 'human',
      trigger_scheduled_post: 'human',
      cancel_scheduled_post_by_id: 'ai',
      publish_scheduled_post_now: 'ai',
      get_scheduled_post: 'ai',
      get_platform_requirements: 'ai',
      publish_post: 'both',
      schedule_post: 'both',
      validate_content: 'both',
      list_accounts: 'both',
      list_scheduled_posts: 'both',
      get_post_analytics: 'both',
      list_failed_posts: 'both',
    });
  });

  test('ai-visible actions take no dropdown props', () => {
    for (const action of actions.filter((a) => a.audience !== 'human')) {
      for (const [key, prop] of Object.entries(action.props)) {
        const type = typeof prop === 'object' && prop !== null && 'type' in prop ? prop.type : undefined;
        expect(type, `${action.name}.${key}`).not.toBe('DROPDOWN');
      }
    }
  });
});
