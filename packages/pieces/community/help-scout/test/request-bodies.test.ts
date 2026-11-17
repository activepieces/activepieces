import { describe, expect, it } from 'vitest';
import { helpScoutApi } from '../src/lib/common/api';

describe('buildConversationBody', () => {
  it('builds only known keys and numeric ids', () => {
    const body = helpScoutApi.buildConversationBody({
      type: 'email', mailboxId: 1, subject: 'Hi', customerEmail: 'a@b.com', status: 'active',
      threadType: 'customer', text: 'Hello', tags: ['vip'], cc: ['c@d.com'], bcc: [], userId: 7, assignTo: 8,
    });
    expect(Object.keys(body).sort()).toEqual(['assignTo', 'customer', 'mailboxId', 'status', 'subject', 'tags', 'threads', 'type', 'user']);
    expect(body['user']).toBe(7);
    expect(body['threads']).toEqual([{ type: 'customer', text: 'Hello', customer: { email: 'a@b.com' }, cc: ['c@d.com'] }]);
  });
  it('prefers customer id over email and omits empty optionals', () => {
    const body = helpScoutApi.buildConversationBody({
      type: 'chat', mailboxId: 1, subject: 'S', customerEmail: 'a@b.com', customerId: 5, status: 'closed',
      threadType: 'chat', text: 'T', tags: [], cc: ['x@y.com'], bcc: [],
    });
    expect(body['customer']).toEqual({ id: 5 });
    expect(body).not.toHaveProperty('tags');
    expect(body).not.toHaveProperty('user');
    expect(body['threads']).toEqual([{ type: 'chat', text: 'T', customer: { id: 5 } }]);
  });
});

describe('buildReplyBody', () => {
  it('sends user as a number and omits unset flags', () => {
    const body = helpScoutApi.buildReplyBody({ text: 'Hi', customerEmail: 'a@b.com', userId: helpScoutApi.optionalNumber('42'), cc: [], bcc: [] });
    expect(body).toEqual({ text: 'Hi', customer: { email: 'a@b.com' }, user: 42 });
  });
  it('maps yes/no draft', () => {
    expect(helpScoutApi.yesNoToBoolean('yes')).toBe(true);
    expect(helpScoutApi.yesNoToBoolean('no')).toBe(false);
    expect(helpScoutApi.yesNoToBoolean(undefined)).toBeUndefined();
  });
});

describe('mergeTags', () => {
  const current = ['vip', 'billing'];
  it('adds without duplicates', () => {
    expect(helpScoutApi.mergeTags({ current, requested: ['VIP', 'new'], mode: 'add' })).toEqual(['vip', 'billing', 'new']);
  });
  it('removes case-insensitively', () => {
    expect(helpScoutApi.mergeTags({ current, requested: ['Billing'], mode: 'remove' })).toEqual(['vip']);
  });
  it('replaces', () => {
    expect(helpScoutApi.mergeTags({ current, requested: ['x'], mode: 'replace' })).toEqual(['x']);
    expect(helpScoutApi.mergeTags({ current, requested: [], mode: 'replace' })).toEqual([]);
  });
  it('reads tag names from a conversation', () => {
    expect(helpScoutApi.readTagNames({ tags: [{ id: 1, tag: 'vip' }, { id: 2 }] })).toEqual(['vip']);
  });
});
