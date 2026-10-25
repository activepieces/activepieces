import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpError, ok, runAction, TEST_AUTH } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

import { tarventAuth } from '../src/lib/auth';
import { createAudienceGroup } from '../src/lib/actions/create-audience-group';
import { createContact } from '../src/lib/actions/create-contact';
import { createContactNote } from '../src/lib/actions/create-contact-note';
import { createSuppressionFilter } from '../src/lib/actions/create-suppression-filter';
import { createTransaction, createTransactionAi } from '../src/lib/actions/create-transaction';
import { tarventCustomApiCall } from '../src/lib/actions/custom-api-call';
import { getContact } from '../src/lib/actions/get-contact';
import { getJourney } from '../src/lib/actions/get-journey';
import { removeSuppressionFilter } from '../src/lib/actions/remove-suppression-filter';
import { sendCampaign } from '../src/lib/actions/send-campaign';
import { updateContact } from '../src/lib/actions/update-contact';
import { updateContactTags } from '../src/lib/actions/update-contact-tag';
import { tarvent } from '../src';

const UNAUTHORIZED = { errors: [{ message: 'The current user is not authorized to access this resource.', extensions: { code: '1020' } }], data: { audiences: null } };

function validate(): Promise<unknown> {
  return Reflect.apply(tarventAuth.validate ?? (() => undefined), tarventAuth, [{ auth: TEST_AUTH.props, server: { apiUrl: '', publicUrl: '' } }]);
}

function call(index = 0) {
  return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('transport', () => {
  it('sends trimmed key and account headers to the GraphQL endpoint with TLS verification', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { contact: { id: 'c1' } } }));
    await runAction({ action: getContact, propsValue: { audienceId: 'a1', contactId: 'c1' } });
    const request = call();
    expect(request.url).toBe('https://api.tarvent.com/graphql');
    expect(request.method).toBe('POST');
    expect(request.headers).toMatchObject({ 'x-api-key': 'key_1', account: 'acc_1', 'Content-Type': 'application/json' });
    expect(request.body.variables).toEqual({ input: { audienceId: 'a1', emailAddress: null, id: 'c1' } });
    expect(sendRequest.mock.calls[0][1].dispatcher).toBeDefined();
  });

  it('fails a 200 response that carries GraphQL errors', async () => {
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: "NotFound: Entity 'Audience' was not found.", extensions: { code: '1030' } }], data: { createContact: null } }));
    await expect(runAction({ action: createContact, propsValue: { audienceId: 'a1', email: 'x@example.com', updateAction: 'Update' } })).rejects.toThrow(/Entity 'Audience' was not found.*1030/);
  });

  it('maps the unauthorized message (not the shared 1020 code) to invalid credentials', async () => {
    sendRequest.mockResolvedValueOnce(ok(UNAUTHORIZED));
    await expect(runAction({ action: getJourney, propsValue: {} })).rejects.toThrow(/Invalid Tarvent API key or account ID/);
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: 'The maximum allowed items per page were exceeded.', extensions: { code: '1020' } }] }));
    await expect(runAction({ action: getJourney, propsValue: {} })).rejects.toThrow(/maximum allowed items/);
  });

  it('explains missing key permissions (code 1070)', async () => {
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: 'BadRequest: Unauthorized. User does not have appropriate rights to grant access.', extensions: { code: '1070' } }] }));
    await expect(runAction({ action: getJourney, propsValue: {} })).rejects.toThrow(/does not have permission/);
  });

  it('maps HTTP 401 to invalid credentials', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: {} }));
    await expect(runAction({ action: getJourney, propsValue: {} })).rejects.toThrow(/Invalid Tarvent API key/);
  });
});

describe('auth.validate', () => {
  it('rejects a key that Tarvent answers with 200 + unauthorized error', async () => {
    sendRequest.mockResolvedValueOnce(ok(UNAUTHORIZED));
    const result = await validate();
    expect(result).toEqual({ valid: false, error: expect.stringMatching(/Invalid Tarvent API key/) });
  });

  it('accepts a working key', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { audiences: { nodes: [] } } }));
    const result = await validate();
    expect(result).toEqual({ valid: true });
  });

  it('accepts a key that lacks permission to read audiences (code 1070)', async () => {
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: 'BadRequest: Unauthorized. User does not have appropriate rights to grant access.', extensions: { code: '1070' } }] }));
    const result = await validate();
    expect(result).toEqual({ valid: true });
  });

  it('stores the API key as a secret', () => {
    expect(tarventAuth.props.apiKey.type).toBe('SECRET_TEXT');
  });
});

describe('actions', () => {
  it('Find Journey asks for a full page and returns paging info', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { journeys: { nodes: [{ id: 'j1' }, { id: 'j2' }], pageInfo: { hasNextPage: true, endCursor: 'cur2' } } } }));
    const result = await runAction({ action: getJourney, propsValue: { name: 'Welcome', status: 'RUNNING' } });
    expect(call().body.variables.first).toBe(50);
    expect(call().body.variables.where).toEqual({ and: [{ name: { contains: 'Welcome' } }, { status: { in: ['RUNNING'] } }] });
    expect(result).toMatchObject({ count: 2, hasMore: true, nextCursor: 'cur2' });
  });

  it('Find Contact needs exactly one of email or ID and reports not found', async () => {
    await expect(runAction({ action: getContact, propsValue: { audienceId: 'a1' } })).rejects.toThrow(/exactly one/);
    sendRequest
      .mockResolvedValueOnce(ok({ errors: [{ message: 'NotFound: No contact not found.', extensions: { code: '1030' } }], data: { contact: null } }))
      .mockResolvedValueOnce(ok({ data: { contacts: { nodes: [], pageInfo: { hasNextPage: false } } } }));
    await expect(runAction({ action: getContact, propsValue: { audienceId: 'a1', email: 'n@example.com' } })).resolves.toEqual({ found: false, contact: null });
    expect(call(1).body.variables).toMatchObject({ input: { audienceId: 'a1' }, first: 1 });
  });

  it('Find Contact fails when the audience itself is missing or not granted', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ errors: [{ message: 'NotFound: No contact not found.', extensions: { code: '1030' } }], data: { contact: null } }))
      .mockResolvedValueOnce(ok({ errors: [{ message: 'BadRequest: Access to audience has not been granted', extensions: { code: '1090' } }] }));
    await expect(runAction({ action: getContact, propsValue: { audienceId: 'gone', email: 'n@example.com' } })).rejects.toThrow(/Access to audience/);
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: "NotFound: Entity 'Audience' was not found.", extensions: { code: '1030' } }] }));
    await expect(runAction({ action: getContact, propsValue: { audienceId: 'gone', email: 'n@example.com' } })).rejects.toThrow(/Audience/);
  });

  it('Find Contact keeps treating an email value without @ as a contact ID', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { contact: { id: 'c9' } } }));
    await runAction({ action: getContact, propsValue: { audienceId: 'a1', email: 'c9' } });
    expect(call().body.variables.input).toEqual({ audienceId: 'a1', emailAddress: null, id: 'c9' });
  });

  it('Create Audience Group works without a description', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createAudienceGroup: { id: 'g1', name: 'VIP', description: '', isPublic: false, isDynamic: false } } }));
    const result = await runAction({ action: createAudienceGroup, propsValue: { audienceId: 'a1', name: 'VIP', isPublic: 'false' } });
    expect(result).toMatchObject({ id: 'g1' });
    expect(call().body.variables.input).toMatchObject({ name: 'VIP', description: '', isPublic: false, audienceId: 'a1' });
  });

  it('Create/Update Contact unwraps the contact and does not send empty fields', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createContact: { id: 'c1', email: 'x@example.com' } } }));
    const result = await runAction({ action: createContact, propsValue: { audienceId: 'a1', email: 'x@example.com', updateAction: 'Update', firstName: '', lastName: 'Doe', audienceDataFields: { f1: '1', f2: '' } } });
    expect(result).toEqual({ id: 'c1', email: 'x@example.com' });
    const input = call().body.variables.input;
    expect(input).not.toHaveProperty('firstName');
    expect(input).toMatchObject({ lastName: 'Doe', updateExisting: true, profile: [{ dataFieldId: 'f1', value: '1' }] });
  });

  it('Update Contact sends only the set fields', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { updateContact: { id: 'c1' } } }));
    await runAction({ action: updateContact, propsValue: { audienceId: 'a1', contactId: 'c1', firstName: 'Ann', lastName: '' } });
    expect(call().body.variables.input).toEqual({ id: 'c1', audienceId: 'a1', firstName: 'Ann' });
    await expect(runAction({ action: updateContact, propsValue: { audienceId: 'a1', contactId: 'c1' } })).rejects.toThrow(/Nothing to update/);
  });

  it('Add Note To Contact does not report the contact ID as a note ID', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createContactNote: { id: 'c1' } } }));
    await expect(runAction({ action: createContactNote, propsValue: { contactId: 'c1', note: 'Hi' } })).resolves.toEqual({ success: true, contactId: 'c1', message: 'Hi' });
  });

  it('Add/Remove Contact Tag maps the legacy lower-case remove value', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { updateContactTags: true } }));
    const result = await runAction({ action: updateContactTags, propsValue: { audienceId: 'a1', contactId: 'c1', action: 'remove', tagIds: ['VIP'] } });
    expect(call().body.variables.input).toEqual({ id: 'c1', audienceId: 'a1', operator: 'REMOVE', tags: ['VIP'] });
    expect(result).toEqual({ success: true, contactId: 'c1', action: 'REMOVE', tags: ['VIP'] });
  });

  it('Add Contact To Suppression List splits the email at the last @', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createAccountSuppressionFilter: { id: 's1', localPart: 'a@b', domain: 'example.com' } } }));
    await runAction({ action: createSuppressionFilter, propsValue: { email: 'a@b@example.com' } });
    expect(call().body.variables.input).toEqual({ localPart: 'a@b', domain: 'example.com', reason: '' });
  });

  it('Remove From Suppression List deletes every exact match', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { accountSuppressionFilters: { nodes: [{ id: 's1', localPart: 'a', domain: 'example.com' }], pageInfo: { hasNextPage: false } } } }))
      .mockResolvedValueOnce(ok({ data: { deleteAccountSuppressionFilter: true } }));
    const result = await runAction({ action: removeSuppressionFilter, propsValue: { email: 'a@example.com' } });
    expect(result).toEqual({ removed: 1, filterIds: ['s1'] });
    expect(call(1).body.variables).toEqual({ id: 's1' });
  });

  it('Send A Transactional Email fails when Tarvent rejects the TO recipient', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createTransaction: [{ emailAddress: 'to@example.com', errorCode: '500', errorMsg: 'Suppressed', requestId: 'r1', transactionId: null }] } }));
    await expect(
      runAction({ action: createTransaction, propsValue: { fromEmail: 'f@example.com', toEmail: 'to@example.com', subject: 'Hi', replyToEmail: 'f@example.com', content: '<p>x</p>', mimeType: 'HTML' } }),
    ).rejects.toThrow(/did not send the email to to@example.com: Suppressed/);
  });

  it('Send A Transactional Email needs a template or content', async () => {
    await expect(
      runAction({ action: createTransaction, propsValue: { fromEmail: 'f@example.com', toEmail: 'to@example.com', subject: 'Hi', replyToEmail: 'f@example.com' } }),
    ).rejects.toThrow(/Template or enter Content/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('Send A Transactional Email returns per-recipient results', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createTransaction: [
      { emailAddress: 'to@example.com', errorCode: null, errorMsg: null, requestId: 'r1', transactionId: 't1' },
      { emailAddress: 'cc@example.com', errorCode: '9', errorMsg: 'Bad', requestId: 'r1', transactionId: null },
    ] } }));
    const result = await runAction({ action: createTransaction, propsValue: { fromEmail: 'f@example.com', toEmail: 'to@example.com', ccEmail: [{ email: 'cc@example.com' }], subject: 'Hi', replyToEmail: 'f@example.com', templateId: 'tpl1' } });
    expect(result).toMatchObject({ requestId: 'r1', transactionId: 't1', recipients: [{ sent: true }, { sent: false, errorMsg: 'Bad' }] });
    expect(call().body.variables.input.recipients.map((r: { type: string }) => r.type)).toEqual(['TO', 'CC']);
    expect(call().body.variables.input.settings).toEqual({ ignoreSuppressCheck: false });
  });

  it('the AI transactional email cannot ignore suppression filters', async () => {
    expect(createTransaction.audience).toBe('human');
    expect(createTransactionAi.audience).toBe('ai');
    expect(Object.keys(createTransactionAi.props)).not.toContain('ignoreSuppressCheck');
    expect(Object.keys(createTransaction.props)).toContain('ignoreSuppressCheck');
    sendRequest.mockResolvedValueOnce(ok({ data: { createTransaction: [{ emailAddress: 'to@example.com', requestId: 'r1', transactionId: 't1' }] } }));
    await runAction({ action: createTransactionAi, propsValue: { fromEmail: 'f@example.com', toEmail: 'to@example.com', subject: 'Hi', replyToEmail: 'f@example.com', templateId: 'tpl1', ignoreSuppressCheck: 'true' } });
    expect(call().body.variables.input.settings).toEqual({ ignoreSuppressCheck: false });
  });

  it('Send Campaign is human-only and fails when Tarvent does not confirm the send', async () => {
    expect(sendCampaign.audience).toBe('human');
    sendRequest.mockResolvedValueOnce(ok({ data: { sendCampaignCopy: null } }));
    await expect(runAction({ action: sendCampaign, propsValue: { campaignId: 'c1' } })).rejects.toThrow(/returned no result/);
  });

  it('Custom API Call refuses other hosts', async () => {
    for (const url of ['https://api.tarvent.com.evil.io/graphql', '//evil.io/x', 'https://user@api.tarvent.com/graphql', 'http://api.tarvent.com/graphql', '/a/../b']) {
      await expect(runAction({ action: tarventCustomApiCall, propsValue: { method: 'POST', url: { url } } })).rejects.toThrow();
    }
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('piece metadata', () => {
  it('every action and trigger has an output schema and AI metadata', () => {
    for (const action of Object.values(tarvent.actions())) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
    for (const trigger of Object.values(tarvent.triggers())) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });
});
