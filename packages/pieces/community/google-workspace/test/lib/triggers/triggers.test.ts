import { describe, expect, it } from 'vitest';

import type { ActivityEvent } from '../../../src/lib/common/activities';
import { acceptUserEvent } from '../../../src/lib/triggers/new-user-event';

function event(name: string, type = 'USER_SETTINGS', email = 'jane@example.com'): ActivityEvent {
  return {
    id: `t:${name}`,
    time: 't',
    application: 'admin',
    eventType: type,
    eventName: name,
    actor: { email: 'admin@example.com', profileId: null, callerType: null },
    ipAddress: null,
    ownerDomain: null,
    parameters: { USER_EMAIL: email },
    activity: {},
  };
}

describe('acceptUserEvent()', () => {
  it('should match lifecycle events to the selected kinds', () => {
    expect(acceptUserEvent({ event: event('CREATE_USER'), props: { kinds: ['created'] } })).toBe(true);
    expect(acceptUserEvent({ event: event('DELETE_USER'), props: { kinds: ['created'] } })).toBe(false);
    expect(acceptUserEvent({ event: event('SUSPEND_USER'), props: { kinds: ['suspended', 'unsuspended'] } })).toBe(true);
    expect(acceptUserEvent({ event: event('REVOKE_ADMIN_PRIVILEGE'), props: { kinds: ['admin_changed'] } })).toBe(true);
  });

  it('should treat any other USER_SETTINGS event as "updated"', () => {
    expect(acceptUserEvent({ event: event('CHANGE_FIRST_NAME'), props: { kinds: ['updated'] } })).toBe(true);
    expect(acceptUserEvent({ event: event('MOVE_USER_TO_ORG_UNIT'), props: { kinds: ['updated'] } })).toBe(true);
    expect(acceptUserEvent({ event: event('CREATE_USER'), props: { kinds: ['updated'] } })).toBe(false);
    expect(acceptUserEvent({ event: event('CHANGE_FIRST_NAME'), props: { kinds: ['created'] } })).toBe(false);
  });

  it('should ignore events of other types and filter by domain, case-insensitively', () => {
    expect(acceptUserEvent({ event: event('CREATE_GROUP', 'GROUP_SETTINGS'), props: { kinds: ['created', 'updated'] } })).toBe(false);
    expect(acceptUserEvent({ event: event('CREATE_USER'), props: { kinds: ['created'], domain: 'Example.com' } })).toBe(true);
    expect(acceptUserEvent({ event: event('CREATE_USER', 'USER_SETTINGS', 'bob@other.org'), props: { kinds: ['created'], domain: 'example.com' } })).toBe(false);
    expect(acceptUserEvent({ event: { ...event('CREATE_USER'), parameters: {} }, props: { kinds: ['created'], domain: 'example.com' } })).toBe(false);
  });
});

