import { httpClient, HttpError } from '@activepieces/pieces-common';
import { createHmac } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inkly } from '../src/index';
import { sendDocumentAction } from '../src/lib/actions/send-document';
import { createDraftAction } from '../src/lib/actions/create-draft';
import { inklyClient } from '../src/lib/common/client';
import { inklyOutput } from '../src/lib/common/output';
import { inklyTemplateInputs } from '../src/lib/common/template-inputs';
import { inklyWebhook } from '../src/lib/common/webhook';

const SECRET = `whsec_${Buffer.from('test-signing-secret').toString('base64')}`;

const template = {
  id: 'a2d94c10-6e7b-4f38-8c15-1f3e9b7d6c02',
  title: 'Consulting Agreement',
  created_at: '2026-11-01T00:00:00.000Z',
  roles: [
    { role_id: '11111111-1111-4111-8111-111111111111', label: 'Client', role: 'signer' as const, in_person: false },
    { role_id: '22222222-2222-4222-8222-222222222222', label: 'Consultant', role: 'signer' as const, in_person: false },
  ],
  prefilled_fields: [
    { label: 'Start Date', key: 'start date', required: true, type: 'date' },
    { label: 'Start Date', key: 'start date', required: true, type: 'date' },
    { label: 'Rate', key: 'rate', required: false, type: 'text' },
  ],
};

const completedDocument = {
  id: 'c3e8a1f2-5b6d-4e7f-8a9b-0c1d2e3f4a5b',
  title: 'Consulting Agreement',
  status: 'completed' as const,
  external_id: null,
  template_id: template.id,
  source: 'api',
  created_at: '2026-11-20T15:02:11.000Z',
  sent_at: '2026-11-20T15:02:12.000Z',
  completed_at: '2026-11-21T09:30:18.000Z',
  voided_at: null,
  recipients: [
    {
      id: 'd4f9b2a3-6c7e-4f80-9b1c-2d3e4f5a6b7c',
      role: 'signer' as const,
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      status: 'signed' as const,
      viewed_at: null,
      signed_at: '2026-11-20T16:12:45.000Z',
      declined_at: null,
      decline_reason: null,
    },
  ],
  fields: [
    { label: 'Name', value: 'Jordan Lee' },
    { label: 'Name', value: 'Sam Rivera' },
    { label: 'Signature', value: null },
    { label: 'Agree', value: true },
  ],
};

function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    get: async (key: string) => data.get(key) ?? null,
    delete: async (key: string) => {
      data.delete(key);
    },
    data,
  };
}

function signedHeaders(rawBody: string, secret = SECRET) {
  const id = 'msg_1';
  const timestamp = '1764000000';
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest('base64');
  return { 'webhook-id': id, 'webhook-timestamp': timestamp, 'webhook-signature': `v1,${signature}` };
}

function okResponse(body: unknown) {
  return { status: 200, headers: {}, body };
}

function runWith(action: { run: unknown }, context: unknown): Promise<unknown> {
  return Reflect.apply(action.run as (...args: unknown[]) => Promise<unknown>, undefined, [context]);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('inkly piece', () => {
  it('registers the planned actions and triggers', () => {
    expect(Object.keys(inkly.actions()).sort()).toEqual(
      ['create_draft', 'custom_api_call', 'download_signed_pdf', 'get_document', 'send_document'].sort(),
    );
    expect(Object.keys(inkly.triggers()).sort()).toEqual(['document_completed', 'document_sent', 'signer_signed']);
  });

  it('tags every hand-written action and trigger for agents', () => {
    for (const action of Object.values(inkly.actions()).filter((entry) => entry.name !== 'custom_api_call')) {
      expect(action.audience, action.name).toBe('both');
      expect(action.classification, action.name).toMatch(/^(READ|WRITE)$/);
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.outputSchema, action.name).toBeDefined();
    }
    for (const trigger of Object.values(inkly.triggers())) {
      expect(trigger.classification, trigger.name).toBe('READ');
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });
});

describe('template inputs', () => {
  it('reads roles and prefilled values through the current template only', () => {
    const values = {
      [inklyTemplateInputs.emailKey(template.roles[0].role_id)]: ' jordan@example.com ',
      [inklyTemplateInputs.nameKey(template.roles[0].role_id)]: 'Jordan Lee',
      [inklyTemplateInputs.emailKey(template.roles[1].role_id)]: 'sam@example.com',
      [inklyTemplateInputs.prefilledKey('Start Date')]: '2026-12-01',
      [inklyTemplateInputs.prefilledKey('Old Field')]: 'ignored',
      role_email_stale: 'old@example.com',
    };
    expect(inklyTemplateInputs.read({ template, values })).toEqual({
      roles: [
        { role_id: template.roles[0].role_id, email: 'jordan@example.com', name: 'Jordan Lee' },
        { role_id: template.roles[1].role_id, email: 'sam@example.com' },
      ],
      prefilled: { 'Start Date': '2026-12-01' },
      missingRoleLabel: null,
    });
  });

  it('names the first role without an email', () => {
    const values = { [inklyTemplateInputs.emailKey(template.roles[0].role_id)]: 'jordan@example.com' };
    expect(inklyTemplateInputs.read({ template, values }).missingRoleLabel).toBe('Consultant');
  });
});

describe('output', () => {
  it('keeps repeated field labels and drops empty values', () => {
    const output = inklyOutput.document({ item: completedDocument, withFieldValues: true });
    expect(output.field_values).toEqual({ Name: 'Jordan Lee', 'Name (2)': 'Sam Rivera', Agree: true });
    expect(output.document_id).toBe(completedDocument.id);
  });
});

describe('webhook signatures', () => {
  it('accepts a valid Standard Webhooks signature and rejects a tampered body', () => {
    const rawBody = '{"id":"evt_1"}';
    const headers = signedHeaders(rawBody);
    expect(inklyWebhook.verifySignature({ secret: SECRET, headers, rawBody })).toBe(true);
    expect(inklyWebhook.verifySignature({ secret: SECRET, headers, rawBody: '{"id":"evt_2"}' })).toBe(false);
    expect(inklyWebhook.verifySignature({ secret: SECRET, headers: {}, rawBody })).toBe(false);
    expect(inklyWebhook.verifySignature({ secret: SECRET, headers, rawBody: undefined })).toBe(false);
  });
});

describe('webhook lifecycle', () => {
  it('replaces an earlier subscription on enable and stores the new secret', async () => {
    const store = memoryStore({ inkly_webhook_subscription: { id: 'old-sub', secret: 'old' } });
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 204, headers: {}, body: '' })
      .mockResolvedValueOnce(okResponse({ subscription: { id: 'new-sub', url: 'https://hooks.example.com/x', events: ['document.completed'], secret: SECRET } }));

    await inklyWebhook.enable({ apiKey: 'key', webhookUrl: 'https://hooks.example.com/x', event: 'document.completed', store });

    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'DELETE', url: `${inklyClient.BASE_URL}/webhook-subscriptions/old-sub` });
    expect(spy.mock.calls[1][0]).toMatchObject({
      method: 'POST',
      url: `${inklyClient.BASE_URL}/webhook-subscriptions`,
      body: { url: 'https://hooks.example.com/x', events: ['document.completed'] },
      headers: { Authorization: 'Bearer key', 'Inkly-Client': 'activepieces' },
    });
    expect(store.data.get('inkly_webhook_subscription')).toEqual({ id: 'new-sub', secret: SECRET });
  });

  it('refuses a webhook URL that is not https', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      inklyWebhook.enable({ apiKey: 'key', webhookUrl: 'http://localhost:4200/x', event: 'document.sent', store: memoryStore() }),
    ).rejects.toThrow(/https/);
    expect(spy).not.toHaveBeenCalled();
  });

  it('treats an already removed subscription as removed on disable', async () => {
    const store = memoryStore({ inkly_webhook_subscription: { id: 'gone', secret: SECRET } });
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: { error: { code: 'webhook_subscription_not_found', message: 'Webhook subscription not found.', param: null, request_id: 'req_1' } } }),
    );
    await inklyWebhook.disable({ apiKey: 'key', store });
    expect(store.data.has('inkly_webhook_subscription')).toBe(false);
  });

  it('re-reads the document and drops events that are unsigned, stale, or for another type', async () => {
    const store = memoryStore({ inkly_webhook_subscription: { id: 'sub', secret: SECRET } });
    const body = { id: 'evt_1', type: 'document.completed', document: { id: completedDocument.id } };
    const rawBody = JSON.stringify(body);
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({ document: completedDocument }));

    const received = await inklyWebhook.receive({
      apiKey: 'key',
      event: 'document.completed',
      store,
      payload: { body, rawBody, headers: signedHeaders(rawBody) },
    });
    expect(received?.eventId).toBe('evt_1');
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'GET', url: `${inklyClient.BASE_URL}/documents/${completedDocument.id}` });

    const forged = await inklyWebhook.receive({
      apiKey: 'key',
      event: 'document.completed',
      store,
      payload: { body, rawBody, headers: signedHeaders(rawBody, `whsec_${Buffer.from('other').toString('base64')}`) },
    });
    expect(forged).toBeNull();

    const otherType = { ...body, type: 'document.sent' };
    const otherRaw = JSON.stringify(otherType);
    expect(
      await inklyWebhook.receive({ apiKey: 'key', event: 'document.completed', store, payload: { body: otherType, rawBody: otherRaw, headers: signedHeaders(otherRaw) } }),
    ).toBeNull();

    spy.mockResolvedValue(okResponse({ document: { ...completedDocument, status: 'sent' } }));
    expect(
      await inklyWebhook.receive({ apiKey: 'key', event: 'document.completed', store, payload: { body, rawBody, headers: signedHeaders(rawBody) } }),
    ).toBeNull();
  });
});

describe('send and draft actions', () => {
  const inputs = {
    [inklyTemplateInputs.emailKey(template.roles[0].role_id)]: 'jordan@example.com',
    [inklyTemplateInputs.emailKey(template.roles[1].role_id)]: 'sam@example.com',
    [inklyTemplateInputs.prefilledKey('Start Date')]: '2026-12-01',
  };

  function context(propsValue: Record<string, unknown>) {
    return {
      auth: { secret_text: 'key' },
      propsValue: { template: template.id, template_inputs: inputs, ...propsValue },
      flows: { current: { id: 'flow_1', version: { id: 'v1' } } },
      step: { name: 'step_1' },
    };
  }

  it('sends with a stable Idempotency-Key when a Unique ID is given', async () => {
    const sendResponse = {
      document: { id: 'doc_1', title: 'Consulting Agreement', status: 'sent', external_id: 'deal-1', template_id: template.id, created_at: '2026-11-20T15:02:11.000Z' },
      recipients: [],
    };
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) =>
      okResponse(request.method === 'GET' ? { template } : sendResponse),
    );

    await runWith(sendDocumentAction, context({ unique_id: 'deal-1', automatic_reminders: true }));
    await runWith(sendDocumentAction, context({ unique_id: 'deal-1', automatic_reminders: true }));

    const sends = spy.mock.calls.map(([request]) => request).filter((request) => request.method === 'POST');
    expect(sends).toHaveLength(2);
    expect(sends[0].headers?.['Idempotency-Key']).toMatch(/^activepieces-[0-9a-f]{64}$/);
    expect(sends[0].headers?.['Idempotency-Key']).toBe(sends[1].headers?.['Idempotency-Key']);
    expect(sends[0].body).toEqual({
      template_id: template.id,
      recipients: [
        { role_id: template.roles[0].role_id, email: 'jordan@example.com' },
        { role_id: template.roles[1].role_id, email: 'sam@example.com' },
      ],
      prefilled_values: { 'Start Date': '2026-12-01' },
      automatic_reminders: true,
      external_id: 'deal-1',
    });
  });

  it('prepares a draft with roles, prefilled values, and a request_id, and no Idempotency-Key', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) =>
      okResponse(
        request.method === 'GET'
          ? { template }
          : { document: { id: 'doc_2', status: 'draft', review_url: 'https://www.inkly.so/r/1', app_url: 'https://www.inkly.so/d/1' } },
      ),
    );

    const output = await runWith(createDraftAction, context({ title: 'Agreement for Jordan' }));

    const draft = spy.mock.calls.map(([request]) => request).find((request) => request.method === 'POST');
    expect(draft?.url).toBe(`${inklyClient.BASE_URL}/drafts`);
    expect(draft?.headers?.['Idempotency-Key']).toBeUndefined();
    expect(draft?.body).toMatchObject({
      template_id: template.id,
      title: 'Agreement for Jordan',
      prefilled: { 'Start Date': '2026-12-01' },
    });
    expect(output).toEqual({ document_id: 'doc_2', status: 'draft', review_url: 'https://www.inkly.so/r/1', app_url: 'https://www.inkly.so/d/1' });
  });

  it('explains a missing plan in plain words', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 403, responseBody: { error: { code: 'plan_required', message: 'API access requires Pro or Teams.', param: null, request_id: 'req_9' } } }),
    );
    await expect(inklyClient.getAccount({ apiKey: 'key' })).rejects.toThrow(/Pro or Teams plan.*req_9/);
  });
});
