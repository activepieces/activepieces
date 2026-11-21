import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { signNow } from '../src/index';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('piece metadata', () => {
  test('minimum release supports ai atomics', () => {
    expect(signNow.minimumSupportedRelease).toBe('0.88.2');
  });

  test('composites are human-only and new atomics are ai', () => {
    const actions = signNow.actions();
    const audience = (name: string) => Reflect.get(Object(actions[name]), 'audience');
    expect(audience('create_document_from_template_and_send_invite')).toBe('human');
    expect(audience('create_document_from_template_and_send_role_based_invite')).toBe('human');
    expect(audience('create_document_group_from_template_and_send_invite')).toBe('human');
    for (const name of ['list_documents', 'list_templates', 'get_document', 'create_document_from_template', 'send_free_form_invite', 'delete_document']) {
      expect(audience(name)).toBe('ai');
    }
  });

  test('every action except custom api call and every trigger has an output schema', () => {
    const actions = Object.values(signNow.actions()).filter((action) => action.name !== 'custom_api_call');
    expect(actions.every((action) => action.outputSchema !== undefined)).toBe(true);
    expect(Object.values(signNow.triggers()).every((trigger) => trigger.outputSchema !== undefined)).toBe(true);
  });

  test('no prop description uses backticks or markdown', () => {
    const descriptions = Object.values(signNow.actions()).flatMap((action) => Object.values(action.props).map((prop) => String(prop.description ?? '')));
    expect(descriptions.filter((text) => /[`*[\]{}]/.test(text))).toEqual([]);
  });
});

function stubRoutes({ routes }: { routes: (args: { url: string; method: string }) => { status: number; body: unknown } }): string[] {
  const seen: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const method = init.method ?? 'GET';
      seen.push(`${method} ${url}`);
      const r = routes({ url, method });
      return new Response(JSON.stringify(r.body), { status: r.status });
    })
  );
  return seen;
}

function runAction({ name, propsValue }: { name: string; propsValue: Record<string, unknown> }): Promise<unknown> {
  const action = signNow.actions()[name];
  const context = {
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: { apiKey: 'KEY' } },
    propsValue,
    files: { write: async () => 'file-url' },
  };
  return Reflect.apply(action.run, action, [context]);
}

describe('live-test fixes', () => {
  test('list_documents treats the empty-account 400 as an empty list', async () => {
    stubRoutes({ routes: () => ({ status: 400, body: { error: 'could not get document ids for user (1) api action id (1)', code: 65536 } }) });
    expect(await runAction({ name: 'list_documents', propsValue: { limit: 50 } })).toEqual({ count: 0, total: 0, truncated: false, documents: [] });
  });

  test('list_documents still throws on other 400s', async () => {
    stubRoutes({ routes: () => ({ status: 400, body: { errors: [{ code: 1, message: 'bad request' }] } }) });
    await expect(runAction({ name: 'list_documents', propsValue: { limit: 50 } })).rejects.toThrow(/bad request/);
  });

  test('cancel_invite cancels pending free form invites via /invite/{id}/cancel', async () => {
    const seen = stubRoutes({
      routes: ({ method }) =>
        method === 'GET'
          ? { status: 200, body: { id: 'd1', requests: [{ id: 'r1', canceled: null }, { id: 'r2', canceled: 1 }], field_invites: [] } }
          : { status: 200, body: { status: 'success' } },
    });
    const result = await runAction({ name: 'cancel_invite', propsValue: { document_id: 'd1', reason: 'x' } });
    expect(result).toEqual({ status: 'success', canceled_invite_ids: ['r1'], canceled_field_invites: false });
    expect(seen).toContain('PUT https://api.signnow.com/invite/r1/cancel');
    expect(seen.some((line) => line.includes('fieldinvitecancel'))).toBe(false);
  });

  test('cancel_invite uses fieldinvitecancel for pending field invites', async () => {
    const seen = stubRoutes({
      routes: ({ method }) =>
        method === 'GET'
          ? { status: 200, body: { id: 'd1', requests: [], field_invites: [{ id: 'f1', status: 'pending' }] } }
          : { status: 200, body: { status: 'success' } },
    });
    await runAction({ name: 'cancel_invite', propsValue: { document_id: 'd1', reason: 'x' } });
    expect(seen).toContain('PUT https://api.signnow.com/document/d1/fieldinvitecancel');
  });

  test('cancel_invite gives a clear error when nothing is pending', async () => {
    stubRoutes({ routes: () => ({ status: 200, body: { id: 'd1', requests: [{ id: 'r1', canceled: true }], field_invites: [{ id: 'f1', status: 'fulfilled' }] } }) });
    await expect(runAction({ name: 'cancel_invite', propsValue: { document_id: 'd1', reason: 'x' } })).rejects.toThrow(/no pending invite/);
  });

  test('get_document includes field and free form invites with a type', async () => {
    stubRoutes({
      routes: () => ({
        status: 200,
        body: {
          id: 'd1',
          field_invites: [{ id: 'f1', email: 'a@x.com', role: 'Signer 1', status: 'pending', created: '10' }],
          requests: [{ id: 'r1', signer_email: 'b@x.com', sender_email: 'me@x.com', canceled: null, created: '20', email_statuses: [{ status: 'delivered', created_at: 1, last_reaction_at: 2 }] }],
        },
      }),
    });
    const result = await runAction({ name: 'get_document', propsValue: { document_id: 'd1' } });
    expect(Reflect.get(Object(result), 'invites')).toEqual([
      { id: 'f1', type: 'field', email: 'a@x.com', role: 'Signer 1', status: 'pending', created: 10 },
      { id: 'r1', type: 'free_form', email: 'b@x.com', role: null, status: 'delivered', created: 20 },
    ]);
  });

  test('create_document_from_template echoes the requested name', async () => {
    stubRoutes({ routes: () => ({ status: 200, body: { id: 'new1' } }) });
    expect(await runAction({ name: 'create_document_from_template', propsValue: { template_id: 't1', document_name: ' Lease ' } })).toEqual({ id: 'new1', document_name: 'Lease' });
    expect(await runAction({ name: 'create_document_from_template', propsValue: { template_id: 't1' } })).toEqual({ id: 'new1', document_name: null });
  });

  test('send_free_form_invite validates a missing sender email before calling SignNow', async () => {
    const seen = stubRoutes({ routes: () => ({ status: 200, body: {} }) });
    await expect(runAction({ name: 'send_free_form_invite', propsValue: { document_id: 'd1', to: 'a@x.com' } })).rejects.toThrow("Sender's Email is required.");
    expect(seen).toHaveLength(0);
  });

  test('document_deleted schema models initiator fields', () => {
    const content = signNow.triggers()['document_deleted'].outputSchema?.fields.find((field) => field.key === 'content');
    expect(content?.children?.map((field) => field.key)).toEqual(expect.arrayContaining(['initiator_id', 'initiator_email']));
  });
});

describe('bug hunt fixes', () => {
  test('cancel_invite skips signed free form requests and also cancels pending field invites', async () => {
    const seen = stubRoutes({
      routes: ({ method }) =>
        method === 'GET'
          ? {
              status: 200,
              body: {
                id: 'd1',
                requests: [
                  { id: 'r1', canceled: null },
                  { id: 'r2', canceled: null, signature_id: 's9' },
                  { id: 'r3', canceled: null, email_statuses: [{ status: 'fulfilled' }] },
                ],
                field_invites: [{ id: 'f1', status: 'pending' }],
              },
            }
          : { status: 200, body: { status: 'success' } },
    });
    const result = await runAction({ name: 'cancel_invite', propsValue: { document_id: 'd1', reason: 'x' } });
    expect(result).toEqual({ status: 'success', canceled_invite_ids: ['r1'], canceled_field_invites: true });
    expect(seen).toContain('PUT https://api.signnow.com/document/d1/fieldinvitecancel');
    expect(seen.some((line) => line.includes('/invite/r2/') || line.includes('/invite/r3/'))).toBe(false);
  });

  test('cancel_invite names already cancelled IDs on a partial failure', async () => {
    stubRoutes({
      routes: ({ url, method }) =>
        method === 'GET'
          ? { status: 200, body: { id: 'd1', requests: [{ id: 'r1' }], field_invites: [{ id: 'f1', status: 'sent' }] } }
          : url.includes('fieldinvitecancel')
            ? { status: 400, body: { errors: [{ code: 65582, message: 'nope' }] } }
            : { status: 200, body: { status: 'success' } },
    });
    await expect(runAction({ name: 'cancel_invite', propsValue: { document_id: 'd1', reason: 'x' } })).rejects.toThrow(/nope.*already cancelled: r1/);
  });

  test('unknown field invite status is not pending', async () => {
    stubRoutes({ routes: () => ({ status: 200, body: { id: 'd1', requests: [], field_invites: [{ id: 'f1', status: 'mystery' }] } }) });
    await expect(runAction({ name: 'cancel_invite', propsValue: { document_id: 'd1', reason: 'x' } })).rejects.toThrow(/no pending invite/);
  });

  test('download prefers filename* and survives bad percent-encoding', async () => {
    stubRoutes({ routes: () => ({ status: 200, body: {} }) });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('PDF', { status: 200, headers: { 'content-disposition': `attachment; filename="plain.pdf"; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf` } }))
    );
    expect(await runAction({ name: 'download_document', propsValue: { document_id: 'd1' } })).toEqual({ file: 'file-url', fileName: 'résumé.pdf' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('PDF', { status: 200, headers: { 'content-disposition': `attachment; filename*=UTF-8''bad%E0.pdf` } })));
    expect(await runAction({ name: 'download_document', propsValue: { document_id: 'd1' } })).toEqual({ file: 'file-url', fileName: 'bad%E0.pdf' });
  });

  test('download aborts a stream past 50 MB without a content-length', async () => {
    const chunk = new Uint8Array(1024 * 1024);
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 1;
        controller.enqueue(chunk);
      },
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(stream, { status: 200 })));
    await expect(runAction({ name: 'download_document', propsValue: { document_id: 'd1' } })).rejects.toThrow(/larger than 50 MB/);
    expect(sent).toBeLessThan(60);
  });
});

describe('template copy name', () => {
  test('create_document_from_template reads name from the live copy response', async () => {
    stubRoutes({ routes: () => ({ status: 200, body: { id: 'e28f', name: 'AP send_invite test' } }) });
    expect(await runAction({ name: 'create_document_from_template', propsValue: { template_id: 't1' } })).toEqual({ id: 'e28f', document_name: 'AP send_invite test' });
  });

  test('both composites return the name from the copy response', async () => {
    stubRoutes({
      routes: ({ url }) => (url.includes('/copy') ? { status: 200, body: { id: 'e28f', name: 'AP send_invite test' } } : { status: 200, body: { result: 'success', status: 'success' } }),
    });
    const freeForm = await runAction({ name: 'create_document_from_template_and_send_invite', propsValue: { template_id: 't1', to: 'a@x.com', from: 'me@x.com' } });
    expect(Reflect.get(Object(freeForm), 'document_name')).toBe('AP send_invite test');
    const roleBased = await runAction({
      name: 'create_document_from_template_and_send_role_based_invite',
      propsValue: { template_id: 't1', from: 'me@x.com', signers: [{ email: 'a@x.com', role: 'Signer 1', order: 1 }] },
    });
    expect(Reflect.get(Object(roleBased), 'document_name')).toBe('AP send_invite test');
  });

  test('composite falls back to the requested name when the response has none', async () => {
    stubRoutes({ routes: ({ url }) => (url.includes('/copy') ? { status: 200, body: { id: 'e28f' } } : { status: 200, body: {} }) });
    const result = await runAction({ name: 'create_document_from_template_and_send_invite', propsValue: { template_id: 't1', document_name: 'Mine', to: 'a@x.com', from: 'me@x.com' } });
    expect(Reflect.get(Object(result), 'document_name')).toBe('Mine');
  });
});

describe('pre-PR P3 fixes', () => {
  test('group invite with no documents and no Document ID throws before the invite call', async () => {
    const seen = stubRoutes({ routes: () => ({ status: 200, body: { data: { unique_id: 'g1', documents: [] } } }) });
    await expect(
      runAction({
        name: 'create_document_group_from_template_and_send_invite',
        propsValue: { template_id: 't1', group_name: 'G', signers: [{ email: 'a@x.com', role_name: 'Signer 1', action: 'sign', order: 1 }] },
      })
    ).rejects.toThrow('Document group g1 was created, but it has no documents, so recipient 1 needs a Document ID.');
    expect(seen.some((line) => line.includes('groupinvite'))).toBe(false);
  });

  test('download strips path parts from the file name', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('PDF', { status: 200, headers: { 'content-disposition': 'attachment; filename="../../etc\\evil.pdf"' } })));
    expect(await runAction({ name: 'download_document', propsValue: { document_id: 'd1' } })).toEqual({ file: 'file-url', fileName: 'evil.pdf' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('PDF', { status: 200, headers: { 'content-disposition': 'attachment; filename="dir/"' } })));
    expect(await runAction({ name: 'download_document', propsValue: { document_id: 'd1' } })).toEqual({ file: 'file-url', fileName: 'document.pdf' });
  });
});

describe('preflight: step tags', () => {
  test('every trigger keeps its name and is tagged READ', () => {
    const triggers = signNow.triggers();
    expect(Object.keys(triggers).sort()).toEqual(['document_completed', 'document_deleted', 'document_group_completed', 'document_updated', 'new_document']);
    expect(Object.values(triggers).every((trigger) => trigger.classification === 'READ')).toBe(true);
  });

  test('cancel_invite is tagged WRITE', () => {
    expect(signNow.actions()['cancel_invite'].classification).toBe('WRITE');
  });
});
