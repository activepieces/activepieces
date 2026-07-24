import { describe, expect, it } from 'vitest';
import { memberEditedUtils } from '../src/lib/triggers/member-edited-utils';

function payloadWithPrevious(previous: Record<string, unknown>): unknown {
  return {
    member: {
      current: {
        id: '6a5e3d4116d89900011f4601',
        email: 'portal1@example.com',
        name: 'Portal One',
        created_at: '2026-07-20T15:22:54.000Z',
        updated_at: '2026-07-20T15:22:55.000Z',
      },
      previous,
    },
  };
}

describe('memberEditedUtils.hasMemberFieldChanges', () => {
  it.each([
    [
      'filters the signup-driven last_seen_at stamp',
      { last_seen_at: null, updated_at: '2026-07-20T15:22:54.000Z' },
      false,
    ],
    [
      'filters the async geolocation update',
      { geolocation: null, updated_at: '2026-07-20T15:22:54.000Z' },
      false,
    ],
    ['filters an empty previous object', {}, false],
    [
      'keeps a genuine name edit',
      { name: null, updated_at: '2026-07-20T15:22:55.000Z' },
      true,
    ],
    [
      'keeps a genuine email edit',
      { email: 'old@example.com', updated_at: '2026-07-20T15:22:55.000Z' },
      true,
    ],
    [
      'keeps an edit to any other member field',
      { status: 'free', updated_at: '2026-07-20T15:22:55.000Z' },
      true,
    ],
    [
      'keeps an edit that also carries activity stamps',
      {
        name: null,
        last_seen_at: null,
        updated_at: '2026-07-20T15:22:55.000Z',
      },
      true,
    ],
  ])('%s', (_name, previous, expected) => {
    expect(
      memberEditedUtils.hasMemberFieldChanges(payloadWithPrevious(previous))
    ).toBe(expected);
  });

  it('keeps payloads without a previous object', () => {
    expect(
      memberEditedUtils.hasMemberFieldChanges({ member: { current: {} } })
    ).toBe(true);
  });

  it('keeps payloads without a member object', () => {
    expect(memberEditedUtils.hasMemberFieldChanges({ other: true })).toBe(true);
  });

  it('keeps non-object payloads', () => {
    expect(memberEditedUtils.hasMemberFieldChanges('raw')).toBe(true);
    expect(memberEditedUtils.hasMemberFieldChanges(null)).toBe(true);
  });
});
