import { describe, expect, it } from 'vitest';

import type { ActivityEvent } from '../../../src/lib/common/activities';
import { newAdminActivityEvent } from '../../../src/lib/triggers/new-admin-activity-event';
import { newApplicationActivityEvent } from '../../../src/lib/triggers/new-application-activity-event';
import { USER_EVENT_KINDS, acceptUserEvent, newUserEvent } from '../../../src/lib/triggers/new-user-event';

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

describe('the three activity triggers', () => {
  it('should be webhook triggers with distinct names', () => {
    const triggers = [newAdminActivityEvent, newApplicationActivityEvent, newUserEvent];
    expect(triggers.map((t) => t.name)).toEqual(['newAdminActivityEvent', 'newApplicationActivityEvent', 'newUserEvent']);
    expect(triggers.every((t) => t.type === 'WEBHOOK')).toBe(true);
  });

  it('should subscribe the admin and application triggers with the props as filters', () => {
    const admin = newAdminActivityEvent as unknown as { props: Record<string, unknown> };
    const app = newApplicationActivityEvent as unknown as { props: Record<string, { required: boolean }> };
    expect(Object.keys(admin.props)).toEqual(['eventName', 'filters']);
    expect(Object.keys(app.props)).toEqual(['application', 'eventName', 'filters']);
    expect(app.props['application']?.required).toBe(true);
  });

  it('should offer every user event kind as an option with a default of "created"', () => {
    const prop = newUserEvent.props['kinds'] as { defaultValue?: string[]; options: { options: { value: string }[] } };
    expect(prop.defaultValue).toEqual(['created']);
    expect(prop.options.options.map((o) => o.value)).toEqual(USER_EVENT_KINDS.map((k) => k.value));
  });
});
