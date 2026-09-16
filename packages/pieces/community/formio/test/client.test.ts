/// <reference types="vitest/globals" />

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
  HttpMethod: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
  },
  httpClient: {
    sendRequest: (...args: unknown[]) => sendRequest(...args),
  },
}));

import { formioCommon } from '../src/lib/common/client';

const auth = { projectUrl: 'https://forms.example.gov/intake', apiKey: 'a-key' };

const lastRequest = () => sendRequest.mock.calls.at(-1)?.[0];

function reply(body: unknown, headers: Record<string, string> = {}) {
  sendRequest.mockResolvedValueOnce({ body, headers });
}

describe('project URL normalisation', () => {
  test('a trailing slash is dropped so paths are never joined twice', () => {
    expect(formioCommon.normalizeProjectUrl('https://forms.example.gov/intake/')).toBe(
      'https://forms.example.gov/intake'
    );
  });

  test('several trailing slashes are dropped', () => {
    expect(formioCommon.normalizeProjectUrl('https://forms.example.gov///')).toBe(
      'https://forms.example.gov'
    );
  });

  test('surrounding whitespace is ignored', () => {
    expect(formioCommon.normalizeProjectUrl('  https://forms.example.gov  ')).toBe(
      'https://forms.example.gov'
    );
  });

  test('an empty URL is refused', () => {
    expect(() => formioCommon.normalizeProjectUrl('   ')).toThrow(/required/i);
  });

  test('a URL without a scheme is refused rather than guessed at', () => {
    expect(() => formioCommon.normalizeProjectUrl('forms.example.gov')).toThrow(/http/i);
  });

  test('http is accepted, since a self-hosted server may not have TLS', () => {
    expect(formioCommon.normalizeProjectUrl('http://localhost:3001')).toBe('http://localhost:3001');
  });
});

describe('requests', () => {
  beforeEach(() => sendRequest.mockReset());

  test('the API key travels in the x-token header', async () => {
    reply([]);
    await formioCommon.listForms({ auth });

    expect(lastRequest().headers).toEqual({ 'x-token': 'a-key' });
  });

  test('a path is appended to the project URL exactly once', async () => {
    reply([]);
    await formioCommon.listForms({ auth });

    expect(lastRequest().url).toBe('https://forms.example.gov/intake/form');
  });

  test('submission URLs are built from the form path', async () => {
    reply({ _id: 's1' });
    await formioCommon.getSubmission({ auth, formPath: 'citizen-intake', submissionId: 's1' });

    expect(lastRequest().url).toBe(
      'https://forms.example.gov/intake/citizen-intake/submission/s1'
    );
  });

  test('listForms asks for forms rather than resources by default', async () => {
    reply([]);
    await formioCommon.listForms({ auth });

    expect(lastRequest().queryParams).toMatchObject({ type: 'form' });
  });

  test('a non-array forms response degrades to an empty list', async () => {
    reply({ message: 'nope' });

    await expect(formioCommon.listForms({ auth })).resolves.toEqual([]);
  });
});

describe('Content-Range', () => {
  beforeEach(() => sendRequest.mockReset());

  test('the total comes from the header, not the row count', async () => {
    reply([{ _id: 'a' }, { _id: 'b' }], { 'content-range': '0-1/57' });

    const { submissions, total } = await formioCommon.findSubmissions({
      auth,
      formPath: 'citizen-intake',
      queryParams: { limit: '2' },
    });

    expect(submissions).toHaveLength(2);
    expect(total).toBe(57);
  });

  test('a missing header leaves the total undefined rather than wrong', async () => {
    reply([{ _id: 'a' }]);

    const { total } = await formioCommon.findSubmissions({
      auth,
      formPath: 'citizen-intake',
      queryParams: {},
    });

    expect(total).toBeUndefined();
  });

  test('an unparseable header leaves the total undefined', async () => {
    reply([], { 'content-range': 'nonsense' });

    const { total } = await formioCommon.findSubmissions({
      auth,
      formPath: 'citizen-intake',
      queryParams: {},
    });

    expect(total).toBeUndefined();
  });
});

describe('updateSubmission', () => {
  beforeEach(() => sendRequest.mockReset());

  test('merging reads the submission first and keeps the fields not supplied', async () => {
    reply({ _id: 's1', data: { fullName: 'Amina', email: 'amina@example.gov', refNumber: 7 } });
    reply({ _id: 's1', data: {} });

    await formioCommon.updateSubmission({
      auth,
      formPath: 'citizen-intake',
      submissionId: 's1',
      data: { category: 'complaint' },
      merge: true,
    });

    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(lastRequest().body.data).toEqual({
      fullName: 'Amina',
      email: 'amina@example.gov',
      refNumber: 7,
      category: 'complaint',
    });
  });

  test('a supplied field wins over the stored one', async () => {
    reply({ _id: 's1', data: { category: 'permit' } });
    reply({ _id: 's1', data: {} });

    await formioCommon.updateSubmission({
      auth,
      formPath: 'citizen-intake',
      submissionId: 's1',
      data: { category: 'complaint' },
      merge: true,
    });

    expect(lastRequest().body.data.category).toBe('complaint');
  });

  test('replacing sends only the supplied fields and never reads first', async () => {
    reply({ _id: 's1', data: {} });

    await formioCommon.updateSubmission({
      auth,
      formPath: 'citizen-intake',
      submissionId: 's1',
      data: { fullName: 'Only This' },
      merge: false,
    });

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body.data).toEqual({ fullName: 'Only This' });
  });

  test('the update is a PUT carrying the submission id', async () => {
    reply({ _id: 's1', data: {} });

    await formioCommon.updateSubmission({
      auth,
      formPath: 'citizen-intake',
      submissionId: 's1',
      data: {},
      merge: false,
    });

    expect(lastRequest().method).toBe('PUT');
    expect(lastRequest().body._id).toBe('s1');
  });
});

describe('webhook action registration', () => {
  beforeEach(() => sendRequest.mockReset());

  test('the action is created on the form, scoped to the events asked for', async () => {
    reply({ _id: 'action-1' });

    const actionId = await formioCommon.createWebhookAction({
      auth,
      formId: 'form-1',
      webhookUrl: 'https://ap.example/api/v1/webhooks/abc',
      events: ['create'],
    });

    expect(actionId).toBe('action-1');
    expect(lastRequest().url).toBe('https://forms.example.gov/intake/form/form-1/action');
    expect(lastRequest().body).toMatchObject({
      name: 'webhook',
      handler: ['after'],
      method: ['create'],
      settings: { url: 'https://ap.example/api/v1/webhooks/abc' },
    });
  });

  test('an action created without an id is an error rather than a silent no-op', async () => {
    reply({});

    await expect(
      formioCommon.createWebhookAction({
        auth,
        formId: 'form-1',
        webhookUrl: 'https://ap.example/hook',
        events: ['update'],
      })
    ).rejects.toThrow(/id/i);
  });

  test('deleting an action addresses it by id', async () => {
    reply({});

    await formioCommon.deleteWebhookAction({ auth, formId: 'form-1', actionId: 'action-1' });

    expect(lastRequest().method).toBe('DELETE');
    expect(lastRequest().url).toBe(
      'https://forms.example.gov/intake/form/form-1/action/action-1'
    );
  });
});

describe('deleteSubmission', () => {
  beforeEach(() => sendRequest.mockReset());

  test('it reports what it deleted, so a flow can log the id', async () => {
    reply({});

    await expect(
      formioCommon.deleteSubmission({ auth, formPath: 'citizen-intake', submissionId: 's9' })
    ).resolves.toEqual({ deleted: true, submissionId: 's9' });
  });
});
