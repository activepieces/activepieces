import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ActionContext,
  AppConnectionType,
  createMockActionContext,
  InputPropertyMap,
  SecretTextProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { loops } from '../src';
import { loopsAuth } from '../src/lib/auth';
import { createContact } from '../src/lib/actions/create-contact';
import { updateContact } from '../src/lib/actions/update-contact';
import { deleteContact } from '../src/lib/actions/delete-contact';
import { sendEvent } from '../src/lib/actions/send-event';
import { sendTransactionalEmail } from '../src/lib/actions/send-transactional-email';
import { findContact } from '../src/lib/actions/find-contact';
import { findContactByEmail } from '../src/lib/actions/find-contact-by-email';
import { findContactByUserId } from '../src/lib/actions/find-contact-by-user-id';
import { listMailingLists } from '../src/lib/actions/list-mailing-lists';
import { listContactProperties } from '../src/lib/actions/list-contact-properties';
import { listTransactionalEmails } from '../src/lib/actions/list-transactional-emails';
import { checkContactSuppression } from '../src/lib/actions/check-contact-suppression';
import { createContactProperty } from '../src/lib/actions/create-contact-property';
import { LoopsApiError } from '../src/lib/common/client';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

function runAction({ action, propsValue }: RunActionParams): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue });
  const context: LoopsActionContext = {
    ...base,
    auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'key_123' },
  };
  return action.run(context);
}

function respond({ body }: { body: unknown }) {
  sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function fail({ status, body }: { status: number; body: unknown }) {
  sendRequest.mockRejectedValueOnce(new HttpError({}, { status, responseBody: body }));
}

function sent({ index }: { index: number }) {
  return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('piece metadata', () => {
  const actions = loops.actions();

  it('demotes find_contact to human and adds two ai twins', () => {
    expect(actions['find_contact'].audience).toBe('human');
    expect(actions['find_contact_by_email'].audience).toBe('ai');
    expect(actions['find_contact_by_user_id'].audience).toBe('ai');
  });

  it('requires an engine that understands ai atomics', () => {
    expect(loops.minimumSupportedRelease).toBe('0.86.4');
  });

  it('gives every action except custom_api_call an outputSchema and classification', () => {
    const missing = Object.values(actions)
      .filter((action) => action.name !== 'custom_api_call')
      .filter((action) => !action.outputSchema || !action.classification)
      .map((action) => action.name);
    expect(missing).toEqual([]);
  });
});

describe('delete_contact', () => {
  it('sends only the email when identifying by email', async () => {
    respond({ body: { success: true, message: 'Contact deleted.' } });
    await runAction({ action: deleteContact, propsValue: { email: ' a@b.co ', userId: '' } });
    const request = sent({ index: 0 });
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://app.loops.so/api/v1/contacts/delete');
    expect(request.body).toEqual({ email: 'a@b.co' });
    expect(request.headers['Authorization']).toBe('Bearer key_123');
  });

  it('sends only the userId when identifying by user ID', async () => {
    respond({ body: { success: true, message: 'Contact deleted.' } });
    await runAction({ action: deleteContact, propsValue: { userId: 'u1' } });
    expect(sent({ index: 0 }).body).toEqual({ userId: 'u1' });
  });

  it('is not idempotent and surfaces a 404 with the vendor message', async () => {
    expect(deleteContact.aiMetadata?.idempotent).toBe(false);
    fail({ status: 404, body: { success: false, message: 'Contact not found.' } });
    const error = await runAction({ action: deleteContact, propsValue: { email: 'x@y.co' } }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(LoopsApiError);
    expect(error).toMatchObject({ status: 404, responseBody: { message: 'Contact not found.' } });
    expect(String(error)).toContain('Contact not found.');
  });

  it.each([
    ['both empty', { email: ' ', userId: '' }],
    ['both filled', { email: 'a@b.co', userId: 'u1' }],
  ])('rejects %s without calling Loops', async (_, propsValue) => {
    await expect(runAction({ action: deleteContact, propsValue })).rejects.toThrow('Provide exactly one of Email or User ID.');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('error mapping', () => {
  it.each([
    [401, 'API key'],
    [403, '403'],
    [429, 'rate limit'],
    [503, 'server problem'],
  ])('keeps status %i distinct', async (status, text) => {
    fail({ status, body: { message: 'vendor says no' } });
    const error = await runAction({ action: listMailingLists, propsValue: {} }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status, responseBody: { message: 'vendor says no' } });
    expect(String(error)).toContain(text);
    expect(String(error)).toContain('vendor says no');
  });

  it('does not set a body field on the error', async () => {
    fail({ status: 500, body: { message: 'boom' } });
    const error = await runAction({ action: listMailingLists, propsValue: {} }).catch((e: unknown) => e);
    expect(error).not.toHaveProperty('body');
  });
});

describe('send_event', () => {
  it('drops reserved keys from contact properties', async () => {
    respond({ body: { success: true } });
    await runAction({
      action: sendEvent,
      propsValue: {
        email: 'a@b.co',
        eventName: 'signup',
        eventProperties: { plan: 'pro' },
        contactProperties: {
          eventName: 'hijack',
          email: 'evil@b.co',
          userId: 'evil',
          eventProperties: { x: 1 },
          mailingLists: { l: true },
          planName: 'pro',
        },
      },
    });
    const request = sent({ index: 0 });
    expect(request.url).toBe('https://app.loops.so/api/v1/events/send');
    expect(request.body).toEqual({
      email: 'a@b.co',
      eventName: 'signup',
      eventProperties: { plan: 'pro' },
      planName: 'pro',
    });
    expect(request.headers['Idempotency-Key']).toBeUndefined();
  });

  it('sends the idempotency key header when given', async () => {
    respond({ body: { success: true } });
    await runAction({
      action: sendEvent,
      propsValue: { userId: 'u1', eventName: 'signup', idempotencyKey: 'k-1' },
    });
    expect(sent({ index: 0 }).headers['Idempotency-Key']).toBe('k-1');
  });

  it('requires email or user ID', async () => {
    await expect(runAction({ action: sendEvent, propsValue: { eventName: 'signup' } })).rejects.toThrow();
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('send_transactional_email', () => {
  it('posts the template id, variables and idempotency key', async () => {
    respond({ body: { success: true } });
    await runAction({
      action: sendTransactionalEmail,
      propsValue: {
        email: 'a@b.co',
        transactionalId: 'tx1',
        addToAudience: true,
        dataVariables: { name: 'Ann' },
        idempotencyKey: 'k-2',
      },
    });
    const request = sent({ index: 0 });
    expect(request.url).toBe('https://app.loops.so/api/v1/transactional');
    expect(request.body).toEqual({ email: 'a@b.co', transactionalId: 'tx1', addToAudience: true, dataVariables: { name: 'Ann' } });
    expect(request.headers['Idempotency-Key']).toBe('k-2');
  });
});

describe('create_contact and update_contact', () => {
  it('create maps subscribed and filters reserved custom keys', async () => {
    respond({ body: { success: true, id: 'c1' } });
    const result = await runAction({
      action: createContact,
      propsValue: {
        email: 'a@b.co',
        subscribed: 'false',
        customProperties: { email: 'evil@b.co', planName: 'pro' },
      },
    });
    expect(result).toEqual({ success: true, id: 'c1' });
    expect(sent({ index: 0 }).body).toEqual({ email: 'a@b.co', subscribed: false, planName: 'pro' });
  });

  it('update uses PUT and leaves subscription unchanged on Default', async () => {
    respond({ body: { success: true, id: 'c1' } });
    await runAction({
      action: updateContact,
      propsValue: { userId: 'u1', subscribed: 'default', firstName: 'Ann', mailingLists: { list1: true } },
    });
    const request = sent({ index: 0 });
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('https://app.loops.so/api/v1/contacts/update');
    expect(request.body).toEqual({ userId: 'u1', firstName: 'Ann', mailingLists: { list1: true } });
  });

  it('update requires email or user ID', async () => {
    await expect(runAction({ action: updateContact, propsValue: {} })).rejects.toThrow();
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('find contact', () => {
  it('find_contact_by_email queries by email only and reports found', async () => {
    respond({ body: [{ id: 'c1', email: 'a@b.co' }] });
    const result = await runAction({ action: findContactByEmail, propsValue: { email: 'a+tag@b.co' } });
    expect(sent({ index: 0 }).queryParams).toEqual({ email: 'a+tag@b.co' });
    expect(result).toEqual({ found: true, contact: { id: 'c1', email: 'a@b.co' } });
  });

  it('find_contact_by_user_id reports not found on an empty array', async () => {
    respond({ body: [] });
    const result = await runAction({ action: findContactByUserId, propsValue: { userId: 'u1' } });
    expect(sent({ index: 0 }).queryParams).toEqual({ userId: 'u1' });
    expect(result).toEqual({ found: false, contact: null });
  });

  it('find_contact throws on a non-array body instead of returning zero', async () => {
    respond({ body: { message: 'odd' } });
    await expect(
      runAction({ action: findContact, propsValue: { searchBy: 'email', searchValue: 'a@b.co' } }),
    ).rejects.toThrow('unexpected');
  });

  it('rethrows outages instead of reporting not found', async () => {
    fail({ status: 500, body: { message: 'down' } });
    await expect(runAction({ action: findContactByEmail, propsValue: { email: 'a@b.co' } })).rejects.toBeInstanceOf(
      LoopsApiError,
    );
  });
});

describe('list actions', () => {
  it('list_transactional_emails passes cursor and returns nextCursor', async () => {
    respond({
      body: {
        pagination: { nextCursor: 'cur2' },
        data: [{ id: 't1', name: 'Welcome' }],
      },
    });
    const result = await runAction({ action: listTransactionalEmails, propsValue: { perPage: 5, cursor: 'cur1' } });
    expect(sent({ index: 0 }).queryParams).toEqual({ perPage: '10', cursor: 'cur1' });
    expect(result).toEqual({ emails: [{ id: 't1', name: 'Welcome' }], count: 1, nextCursor: 'cur2' });
  });

  it('list_transactional_emails returns null nextCursor on the last page', async () => {
    respond({ body: { pagination: { nextCursor: null }, data: [] } });
    const result = await runAction({ action: listTransactionalEmails, propsValue: {} });
    expect(sent({ index: 0 }).queryParams).toEqual({ perPage: '20' });
    expect(result).toEqual({ emails: [], count: 0, nextCursor: null });
  });

  it('list_mailing_lists applies offset and limit', async () => {
    respond({ body: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
    const result = await runAction({ action: listMailingLists, propsValue: { offset: 1, limit: 1 } });
    expect(sent({ index: 0 }).url).toBe('https://app.loops.so/api/v1/lists');
    expect(result).toEqual({ lists: [{ id: 'b' }], count: 1 });
  });

  it('list_contact_properties sends the list scope', async () => {
    respond({ body: [{ key: 'planName', label: 'Plan Name', type: 'string' }] });
    const result = await runAction({ action: listContactProperties, propsValue: { scope: 'custom' } });
    expect(sent({ index: 0 }).queryParams).toEqual({ list: 'custom' });
    expect(result).toEqual({ properties: [{ key: 'planName', label: 'Plan Name', type: 'string' }], count: 1 });
  });

  it('check_contact_suppression sends exactly one identifier', async () => {
    respond({ body: { contact: { id: 'c1' }, isSuppressed: false, removalQuota: { limit: 10, remaining: 10 } } });
    await runAction({ action: checkContactSuppression, propsValue: { identifyBy: 'userId', value: 'u1' } });
    const request = sent({ index: 0 });
    expect(request.method).toBe('GET');
    expect(request.queryParams).toEqual({ userId: 'u1' });
  });

  it('create_contact_property posts name and type', async () => {
    respond({ body: { success: true } });
    await runAction({ action: createContactProperty, propsValue: { name: ' planName ', type: 'string' } });
    expect(sent({ index: 0 }).body).toEqual({ name: 'planName', type: 'string' });
  });
});

describe('auth validate', () => {
  const server = { apiUrl: 'http://localhost/', publicUrl: 'http://localhost/', mintOidcToken: async () => 'token' };

  it('reports 401 as an invalid key', async () => {
    fail({ status: 401, body: { message: 'Invalid API key' } });
    const result = await loopsAuth.validate?.({ auth: 'bad', server });
    expect(result).toEqual({ valid: false, error: 'Invalid API key. Please check your Loops API key.' });
  });

  it('surfaces the status and vendor message for other failures', async () => {
    fail({ status: 429, body: { message: 'Too many requests' } });
    const result = await loopsAuth.validate?.({ auth: 'key', server });
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('429');
    expect(JSON.stringify(result)).toContain('Too many requests');
  });

  it('accepts a confirmed key', async () => {
    respond({ body: { success: true, teamName: 'Team' } });
    expect(await loopsAuth.validate?.({ auth: 'key', server })).toEqual({ valid: true });
  });
});

type LoopsActionContext = ActionContext<SecretTextProperty<true>, InputPropertyMap>;

type TestAction = {
  run(context: LoopsActionContext): Promise<unknown>;
};

type RunActionParams = {
  action: TestAction;
  propsValue: StaticPropsValue<InputPropertyMap>;
};

describe('identifier warning for agents', () => {
  it('tells agents that sending both IDs overwrites one of them', () => {
    for (const action of [updateContact, sendEvent]) {
      expect(action.aiMetadata?.description).toContain(
        'If both are given, Loops matches on either one and overwrites the other on the matched contact.'
      );
    }
  });
});
