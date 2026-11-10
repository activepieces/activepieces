import { afterEach, describe, expect, test, vi } from 'vitest';
import { openPhoneCommon } from '../src/lib/common';
import { updateContact } from '../src/lib/actions/update-contact';

afterEach(() => vi.restoreAllMocks());

const AUTH = { type: 'SECRET_TEXT', secret_text: 'key' };

function ctx(propsValue: Record<string, unknown>) {
  return Object.assign(Object.create(null), {
    auth: AUTH,
    propsValue: { contactId: 'C1', ...propsValue },
  });
}

function spyRequest() {
  return vi
    .spyOn(openPhoneCommon, 'makeRequest')
    .mockResolvedValue({ data: {} });
}

function sentBody(spy: ReturnType<typeof spyRequest>) {
  return spy.mock.calls[0][3];
}

describe('update contact body', () => {
  test('empty firstName is omitted while emails are kept', async () => {
    const spy = spyRequest();
    await updateContact.run(
      ctx({ firstName: '', emails: [{ name: 'work', value: 'a@b.co' }] })
    );
    const body = sentBody(spy);
    expect(body.defaultFields).not.toHaveProperty('firstName');
    expect(body.defaultFields.emails).toEqual([
      { name: 'work', value: 'a@b.co' },
    ]);
  });

  test('whitespace-only lastName is omitted', async () => {
    const spy = spyRequest();
    await updateContact.run(ctx({ lastName: '   ', company: 'Acme' }));
    expect(sentBody(spy)).toEqual({ defaultFields: { company: 'Acme' } });
  });

  test('null and undefined source fields are not sent', async () => {
    const spy = spyRequest();
    await updateContact.run(
      ctx({ source: null, sourceUrl: undefined, externalId: null, role: 'CEO' })
    );
    const body = sentBody(spy);
    expect(body).not.toHaveProperty('source');
    expect(body).not.toHaveProperty('sourceUrl');
    expect(body).not.toHaveProperty('externalId');
    expect(body).toEqual({ defaultFields: { role: 'CEO' } });
  });

  test('email-only update sends only emails', async () => {
    const spy = spyRequest();
    await updateContact.run(
      ctx({ emails: [{ name: 'work', value: 'a@b.co' }] })
    );
    expect(sentBody(spy)).toEqual({
      defaultFields: { emails: [{ name: 'work', value: 'a@b.co' }] },
    });
  });

  test('no changes rejects without calling the API', async () => {
    const spy = spyRequest();
    await expect(
      updateContact.run(ctx({ firstName: '', lastName: '  ', emails: [] }))
    ).rejects.toThrow('At least one field must be provided to update');
    expect(spy).not.toHaveBeenCalled();
  });

  test('an email with an empty value is sent as null', async () => {
    const spy = spyRequest();
    await updateContact.run(
      ctx({ emails: [{ name: 'work', value: '', id: 'E1' }] })
    );
    expect(sentBody(spy).defaultFields.emails).toEqual([
      { name: 'work', value: null, id: 'E1' },
    ]);
  });

  test('values are trimmed', async () => {
    const spy = spyRequest();
    await updateContact.run(ctx({ firstName: '  Jane ' }));
    expect(sentBody(spy).defaultFields.firstName).toBe('Jane');
  });
});
