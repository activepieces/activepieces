import { describe, it, expect } from 'vitest';
import { buildRecipientBody, RecipientType } from './recipients';
import { ChatType } from './types';

describe('buildRecipientBody', () => {
  const session = 'test-session';

  it('CONTACT: returns session + chatId with pre-formatted value', () => {
    const result = buildRecipientBody(
      RecipientType.CONTACT,
      session,
      '31649931832@c.us',
    );
    expect(result).toEqual({ session, chatId: '31649931832@c.us' });
  });

  it('GROUP: returns session + chatId with pre-formatted value', () => {
    const result = buildRecipientBody(
      RecipientType.GROUP,
      session,
      '120363318673245672@g.us',
    );
    expect(result).toEqual({ session, chatId: '120363318673245672@g.us' });
  });

  it('CHANNEL: returns session + chatId with pre-formatted newsletter value', () => {
    const result = buildRecipientBody(
      RecipientType.CHANNEL,
      session,
      '120363318673245672@newsletter',
    );
    expect(result).toEqual({
      session,
      chatId: '120363318673245672@newsletter',
    });
  });

  it('MANUAL + contact: appends @c.us to recipient', () => {
    const result = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      '31649931832',
      ChatType.CONTACT,
    );
    expect(result).toEqual({ session, chatId: '31649931832@c.us' });
  });

  it('MANUAL + group: appends @g.us to recipient', () => {
    const result = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      '120363318673245672',
      ChatType.GROUP,
    );
    expect(result).toEqual({ session, chatId: '120363318673245672@g.us' });
  });

  it('CRM_CONTACT: returns session + contact_type + crm_contact_id', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const result = buildRecipientBody(
      RecipientType.CRM_CONTACT,
      session,
      uuid,
    );
    expect(result).toEqual({
      session,
      contact_type: 'crm_contact',
      crm_contact_id: uuid,
    });
  });

  it('unknown type: throws an error', () => {
    expect(() =>
      buildRecipientBody('unknown' as RecipientType, session, 'anything'),
    ).toThrow('Unknown recipient type: unknown');
  });

  it('MANUAL + group: does NOT double-append @g.us if value already has suffix', () => {
    const result = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      '120363404919719956@g.us',
      ChatType.GROUP,
    );
    expect(result).toEqual({ session, chatId: '120363404919719956@g.us' });
  });

  it('MANUAL + contact: does NOT double-append @c.us if value already has suffix', () => {
    const result = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      '31649931832@c.us',
      ChatType.CONTACT,
    );
    expect(result).toEqual({ session, chatId: '31649931832@c.us' });
  });
});
