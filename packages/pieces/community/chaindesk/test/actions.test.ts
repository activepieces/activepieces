import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryAgentAction } from '../src/lib/actions/query-agent';
import { queryDatastoretAction } from '../src/lib/actions/query-datastore';
import { uploadFileAction } from '../src/lib/actions/upload-file';
import { listAgentsAction } from '../src/lib/actions/list-agents';
import { listDatastoresAction } from '../src/lib/actions/list-datastores';
import { getDatasourceAction } from '../src/lib/actions/get-datasource';
import { deleteDatasourceAction } from '../src/lib/actions/delete-datasource';
import { addTextToDatastoreAction } from '../src/lib/actions/add-text-to-datastore';
import { addWebPageToDatastoreAction } from '../src/lib/actions/add-web-page-to-datastore';
import { listConversationsAction } from '../src/lib/actions/list-conversations';
import { getConversationMessagesAction } from '../src/lib/actions/get-conversation-messages';
import { agentIdDropdown } from '../src/lib/common/props';
import { chaindesk } from '../src';
import { InputPropertyMap, createMockActionContext } from '@activepieces/pieces-framework';
import { withNotFoundHint, withUsageLimitHint } from '../src/lib/common/errors';
import { FILE_TYPE_FAMILIES, resolveFileName } from '../src/lib/common/file-name';

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

beforeEach(() => {
  sendRequest.mockReset();
});

describe('chaindesk actions', () => {
  it('registers all actions with output schemas', () => {
    const actions = Object.values(chaindesk.actions());
    expect(actions.length).toBe(12);
    for (const a of actions.filter((x) => x.name !== 'custom_api_call')) {
      expect(a.outputSchema).toBeDefined();
    }
  });

  it('query agent sends streaming false and drops blank conversation id', async () => {
    sendRequest.mockResolvedValue({ body: { answer: 'hi', conversationId: 'c1' } });
    const out = await run({ action: queryAgentAction, props: { agentId: 'a/1', query: 'q', conversationId: '  ' } });
    expect(out).toEqual({ answer: 'hi', conversationId: 'c1' });
    const req = lastRequest();
    expect(req.url).toBe('https://app.askli.co/api/agents/a%2F1/query');
    expect(req.body).toEqual({ query: 'q', conversationId: undefined, streaming: false });
  });

  it('query datastore sends topK and rejects bad values', async () => {
    sendRequest.mockResolvedValue({ body: [] });
    await run({ action: queryDatastoretAction, props: { datastoreId: 'd1', query: 'q', topK: 3 } });
    expect(lastRequest().body).toEqual({ query: 'q', topK: 3 });
    await expect(run({ action: queryDatastoretAction, props: { datastoreId: 'd1', query: 'q', topK: 0 } })).rejects.toThrow('Max Results');
  });

  it('upload file appends the file extension to a custom name', async () => {
    sendRequest.mockResolvedValue({ body: { id: 'ds1' } });
    await run({
      action: uploadFileAction,
      props: { datastoreId: 'd1', filename: 'report', file: { filename: 'x.pdf', extension: 'pdf', data: Buffer.from('a') } },
    });
    const body = lastRequest().body.getBuffer().toString();
    expect(body).toContain('filename="report.pdf"');
    expect(body).toContain('report.pdf');
  });

  it('upload file keeps the extension when the custom name has dots', async () => {
    sendRequest.mockResolvedValue({ body: { id: 'ds1' } });
    const file = { filename: 'x.pdf', extension: 'pdf', data: Buffer.from('a') };
    await run({ action: uploadFileAction, props: { datastoreId: 'd1', filename: 'Q3 report v1.2', file } });
    expect(lastRequest().body.getBuffer().toString()).toContain('filename="Q3 report v1.2.pdf"');
    await run({ action: uploadFileAction, props: { datastoreId: 'd1', filename: 'Report.PDF', file } });
    expect(lastRequest().body.getBuffer().toString()).toContain('filename="Report.PDF"');
    await run({ action: uploadFileAction, props: { datastoreId: 'd1', filename: 'notes.txt', file: { filename: 'blob', extension: 'bin', data: Buffer.from('a') } } });
    expect(lastRequest().body.getBuffer().toString()).toContain('filename="notes.txt"');
    await run({ action: uploadFileAction, props: { datastoreId: 'd1', filename: 'Invoice Acme.Inc', file } });
    expect(lastRequest().body.getBuffer().toString()).toContain('filename="Invoice Acme.Inc.pdf"');
    await run({ action: uploadFileAction, props: { datastoreId: 'd1', filename: 'Report.', file } });
    expect(lastRequest().body.getBuffer().toString()).toContain('filename="Report.pdf"');
  });

  it('redacts private request bodies from http errors', async () => {
    sendRequest.mockResolvedValue({ body: { id: 'x', answer: 'a' } });
    const file = { filename: 'x.pdf', extension: 'pdf', data: Buffer.from('a') };
    const cases = [
      { action: addTextToDatastoreAction, props: { datastoreId: 'd', name: 'n', text: 'secret' } },
      { action: addWebPageToDatastoreAction, props: { datastoreId: 'd', type: 'web_page', url: 'https://a.com' } },
      { action: uploadFileAction, props: { datastoreId: 'd1', file } },
      { action: queryAgentAction, props: { agentId: 'a', query: 'q' } },
      { action: queryDatastoretAction, props: { datastoreId: 'd1', query: 'q', topK: 3 } },
    ];
    for (const c of cases) {
      await run(c);
      expect(lastRequest().redactBodyInErrors).toBe(true);
    }
  });

  it('list agents and datastores wrap arrays', async () => {
    sendRequest.mockResolvedValue({ body: [{ id: 'a', name: 'A' }] });
    expect(await run({ action: listAgentsAction, props: {} })).toEqual({ agents: [{ id: 'a', name: 'A' }], count: 1 });
    expect(lastRequest().url).toBe('https://app.askli.co/api/agents');
    expect(await run({ action: listDatastoresAction, props: {} })).toEqual({ datastores: [{ id: 'a', name: 'A' }], count: 1 });
    expect(lastRequest().url).toBe('https://app.askli.co/api/datastores');
  });

  it('get and delete datasource use the right method', async () => {
    sendRequest.mockResolvedValue({ body: { id: 'x' } });
    await run({ action: getDatasourceAction, props: { datasourceId: ' x ' } });
    expect(lastRequest()).toMatchObject({ method: 'GET', url: 'https://app.askli.co/api/datasources/x' });
    await run({ action: deleteDatasourceAction, props: { datasourceId: 'x' } });
    expect(lastRequest()).toMatchObject({ method: 'DELETE', url: 'https://app.askli.co/api/datasources/x' });
  });

  it('add text uses vendor field names', async () => {
    sendRequest.mockResolvedValue({ body: { id: 'x' } });
    await run({ action: addTextToDatastoreAction, props: { datastoreId: 'd', name: ' n ', text: 'hello' } });
    expect(lastRequest().body).toEqual({ type: 'text', datastoreId: 'd', name: 'n', datasourceText: 'hello' });
  });

  it('add web page builds config per type and validates url', async () => {
    sendRequest.mockResolvedValue({ body: { id: 'x' } });
    await run({ action: addWebPageToDatastoreAction, props: { datastoreId: 'd', type: 'web_page', url: 'https://a.com' } });
    expect(lastRequest().body.config).toEqual({ source_url: 'https://a.com' });
    await run({ action: addWebPageToDatastoreAction, props: { datastoreId: 'd', type: 'web_site', url: 'https://a.com/sitemap.xml' } });
    expect(lastRequest().body.config).toEqual({ sitemap: 'https://a.com/sitemap.xml' });
    await expect(run({ action: addWebPageToDatastoreAction, props: { datastoreId: 'd', type: 'web_page', url: 'a.com' } })).rejects.toThrow('URL');
  });

  it('list conversations pages with a cursor', async () => {
    sendRequest.mockResolvedValue({ body: [{ id: 'c1' }, { id: 'c2' }] });
    const out = await run({ action: listConversationsAction, props: { agentId: 'a', take: 2, cursor: 'c0' } });
    expect(lastRequest().queryParams).toEqual({ take: '2', agentId: 'a', cursor: 'c0' });
    expect(out).toMatchObject({ count: 2, next_cursor: 'c2' });
    const short = await run({ action: listConversationsAction, props: { take: 5 } });
    expect(short).toMatchObject({ next_cursor: null });
    await expect(run({ action: listConversationsAction, props: { take: 101 } })).rejects.toThrow('Limit');
  });

  it('get conversation messages returns an array page', async () => {
    sendRequest.mockResolvedValue({ body: [{ id: 'm1', text: 't' }] });
    const out = await run({ action: getConversationMessagesAction, props: { conversationId: 'c1' } });
    expect(out).toMatchObject({ messages: [{ id: 'm1', text: 't' }], count: 1, next_cursor: null });
    expect(lastRequest().url).toBe('https://app.askli.co/api/conversations/c1/messages');
  });

  it.each([
    { action: listAgentsAction, props: {} },
    { action: listDatastoresAction, props: {} },
    { action: listConversationsAction, props: {} },
    { action: getConversationMessagesAction, props: { conversationId: 'c1' } },
  ])('throws on a non-array body', async ({ action, props }) => {
    sendRequest.mockResolvedValue({ body: { id: 'm1' } });
    await expect(run({ action, props })).rejects.toThrow('expected a list');
  });

  it('dropdown degrades on a non-array body', async () => {
    sendRequest.mockResolvedValue({ body: { error: 'x' } });
    const res = await Promise.resolve(Reflect.apply(agentIdDropdown.options, agentIdDropdown, [{ auth: { secret_text: 'k' } }, {}]));
    expect(res).toMatchObject({ disabled: true, options: [], placeholder: 'Could not load agents. Check your connection.' });
  });

  it('dropdown degrades on error', async () => {
    sendRequest.mockRejectedValue(new Error('401'));
    const res = await Promise.resolve(Reflect.apply(agentIdDropdown.options, agentIdDropdown, [{ auth: { secret_text: 'k' } }, {}]));
    expect(res).toMatchObject({ disabled: true, options: [] });
  });
});

describe('withNotFoundHint', () => {
  const notFoundMessage = 'Datasource not found.';

  it('returns the result on success', async () => {
    await expect(withNotFoundHint({ resourceName: 'datasource', request: () => Promise.resolve(5), notFoundMessage })).resolves.toBe(5);
  });

  it('maps plain-text 403 to a bad-key message', async () => {
    const e = await caught({ promise: withNotFoundHint({ resourceName: 'datasource', request: failing({ error: httpError({ status: 403, body: 'Forbidden' }) }), notFoundMessage }) });
    expect(e).toBeInstanceOf(Error);
    expect(String(e)).toContain('rejected the API key');
    expect(String(e)).not.toContain(SECRET_BODY);
  });

  it.each([403, 404])('maps JSON error %i to not-found', async (status) => {
    const e = await caught({ promise: withNotFoundHint({ resourceName: 'datasource', request: failing({ error: httpError({ status, body: { error: 'UNAUTHORIZED' } }) }), notFoundMessage }) });
    expect(String(e)).toContain(`Datasource not found. (Askli returned HTTP ${status}.)`);
    expect(String(e)).not.toContain(SECRET_BODY);
  });

  it('maps a non-JSON 404 to not-found', async () => {
    const e = await caught({ promise: withNotFoundHint({ resourceName: 'datasource', request: failing({ error: httpError({ status: 404, body: 'Not Found' }) }), notFoundMessage }) });
    expect(String(e)).toContain('(Askli returned HTTP 404.)');
    expect(String(e)).not.toContain(SECRET_BODY);
  });

  it('gives JSON 500 its own wording', async () => {
    const e = await caught({ promise: withNotFoundHint({ resourceName: 'datasource', request: failing({ error: httpError({ status: 500, body: { error: 'INTERNAL' } }) }), notFoundMessage }) });
    expect(String(e)).toContain('Askli returned HTTP 500: the datasource may not exist, or Askli had a temporary server error. Check the ID and retry.');
    expect(String(e)).not.toContain('not found');
  });

  it('never rethrows the original error for other statuses', async () => {
    const original = httpError({ status: 502, body: 'Bad Gateway' });
    const e = await caught({ promise: withNotFoundHint({ resourceName: 'datasource', request: failing({ error: original }), notFoundMessage }) });
    expect(e).not.toBe(original);
    expect(String(e)).toContain('Askli returned HTTP 502: Bad Gateway');
    expect(String(e)).not.toContain(SECRET_BODY);
    const net = await caught({ promise: withNotFoundHint({ resourceName: 'datasource', request: failing({ error: new Error(SECRET_BODY) }), notFoundMessage }) });
    expect(String(net)).toContain('could not be reached');
    expect(String(net)).not.toContain(SECRET_BODY);
  });
});

describe('withUsageLimitHint', () => {
  it('returns the result on success', async () => {
    await expect(withUsageLimitHint(() => Promise.resolve('ok'))).resolves.toBe('ok');
  });

  it('maps 402 to a plan-limit message without the request body', async () => {
    const e = await caught({ promise: withUsageLimitHint(failing({ error: httpError({ status: 402, body: { error: 'USAGE_LIMIT' } }) })) });
    expect(String(e)).toContain('plan usage limit');
    expect(String(e)).not.toContain(SECRET_BODY);
  });

  it('maps 403 to a key/datastore message without the request body', async () => {
    const e = await caught({ promise: withUsageLimitHint(failing({ error: httpError({ status: 403, body: 'Forbidden' }) })) });
    expect(String(e)).toContain('Check the API key and that the datastore belongs to this account');
    expect(String(e)).not.toContain(SECRET_BODY);
  });

  it('never rethrows the original error and truncates the vendor body', async () => {
    const original = httpError({ status: 400, body: { error: 'x'.repeat(2000) } });
    const e = await caught({ promise: withUsageLimitHint(failing({ error: original })) });
    expect(e).not.toBe(original);
    expect(String(e)).toContain('Askli returned HTTP 400:');
    expect(String(e).length).toBeLessThan(600);
    expect(String(e)).not.toContain(SECRET_BODY);
  });

  it('Add Text 400 error does not contain the datasource text', async () => {
    const { HttpError } = await import('@activepieces/pieces-common');
    const text = 'very-private-datasource-text';
    sendRequest.mockRejectedValue(
      new HttpError({ type: 'text', datastoreId: 'd', name: 'n', datasourceText: text }, { status: 400, responseBody: { error: 'INVALID_REQUEST' } })
    );
    const e = await caught({ promise: run({ action: addTextToDatastoreAction, props: { datastoreId: 'd', name: 'n', text } }) });
    expect(String(e)).toContain('Askli returned HTTP 400: {"error":"INVALID_REQUEST"}');
    expect(String(e)).not.toContain(text);
  });

  it('Query Agent and the list actions never put the request body in the error', async () => {
    const { HttpError } = await import('@activepieces/pieces-common');
    const query = 'very-private-question';
    sendRequest.mockRejectedValue(new HttpError({ query }, { status: 404, responseBody: { error: 'NOT_FOUND' } }));
    const e = await caught({ promise: run({ action: queryAgentAction, props: { agentId: 'a', query } }) });
    expect(String(e)).toContain('Askli returned HTTP 404');
    expect(String(e)).not.toContain(query);
    const ds = await caught({ promise: run({ action: queryDatastoretAction, props: { datastoreId: 'd', query } }) });
    expect(String(ds)).not.toContain(query);
    for (const action of [listAgentsAction, listDatastoresAction, listConversationsAction]) {
      const le = await caught({ promise: run({ action, props: {} }) });
      expect(String(le)).toContain('Askli returned HTTP 404');
    }
  });

  it('Get/Delete Datasource and Get Messages reject a blank ID', async () => {
    await expect(run({ action: getDatasourceAction, props: { datasourceId: '  ' } })).rejects.toThrow('Datasource ID cannot be empty.');
    await expect(run({ action: deleteDatasourceAction, props: { datasourceId: '' } })).rejects.toThrow('Datasource ID cannot be empty.');
    await expect(run({ action: getConversationMessagesAction, props: { conversationId: ' ' } })).rejects.toThrow('Conversation ID cannot be empty.');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('Query Agent maps a bad key and an unknown agent; list actions map a bad key', async () => {
    const { HttpError } = await import('@activepieces/pieces-common');
    sendRequest.mockRejectedValue(new HttpError({}, { status: 403, responseBody: 'Forbidden' }));
    expect(String(await caught({ promise: run({ action: queryAgentAction, props: { agentId: 'a1', query: 'q' } }) }))).toContain('rejected the API key');
    expect(String(await caught({ promise: run({ action: listAgentsAction, props: {} }) }))).toContain('rejected the API key');
    sendRequest.mockRejectedValue(new HttpError({}, { status: 404, responseBody: { error: 'NOT_FOUND' } }));
    expect(String(await caught({ promise: run({ action: queryAgentAction, props: { agentId: 'a1', query: 'q' } }) }))).toContain('Agent a1 was not found');
    expect(String(await caught({ promise: run({ action: queryAgentAction, props: { agentId: 'a1', query: 'q', conversationId: 'c9' } }) }))).toContain('Agent a1 or conversation c9 was not found');
    sendRequest.mockRejectedValue(new HttpError({}, { status: 500, responseBody: { error: 'MODEL_FAILED' } }));
    expect(String(await caught({ promise: run({ action: queryAgentAction, props: { agentId: 'a1', query: 'q' } }) }))).toContain('Askli returned HTTP 500: {"error":"MODEL_FAILED"}');
  });

  it('network errors: read steps say try again, write steps warn the change may have applied', async () => {
    sendRequest.mockRejectedValue(new Error('socket hang up'));
    for (const [action, props] of [
      [listAgentsAction, {}],
      [getDatasourceAction, { datasourceId: 'x' }],
      [queryDatastoretAction, { datastoreId: 'd', query: 'q' }],
    ] as const) {
      const e = String(await caught({ promise: run({ action, props }) }));
      expect(e).toContain('Try again.');
      expect(e).not.toContain('create or delete');
    }
    const w = String(await caught({ promise: run({ action: deleteDatasourceAction, props: { datasourceId: 'x' } }) }));
    expect(w).toContain('may still have been applied');
  });

  it('Add Text rejects a blank name', async () => {
    await expect(run({ action: addTextToDatastoreAction, props: { datastoreId: 'd', name: '  ', text: 't' } })).rejects.toThrow('Name cannot be empty.');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

const SECRET_BODY = 'secret-request-body-text';

function httpError({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error(`HTTP ${status} ${SECRET_BODY}`), {
    response: { status, body },
    request: { body: SECRET_BODY },
  });
}

function failing({ error }: { error: unknown }) {
  return () => Promise.reject(error);
}

async function caught({ promise }: { promise: Promise<unknown> }): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error('expected rejection');
}

function run({ action, props }: { action: { run: unknown }; props: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(
    Reflect.apply(runFn, action, [{ ...base, auth: { secret_text: 'key-123' }, propsValue: props }])
  );
}

function lastRequest() {
  return sendRequest.mock.calls[sendRequest.mock.calls.length - 1][0];
}

describe('resolveFileName', () => {
  it.each(Object.keys(FILE_TYPE_FAMILIES))('keeps a custom name ending in .%s on a file of an unknown type', (ext) => {
    expect(resolveFileName({ custom: `notes.${ext}`, original: 'blob', extension: 'bin' })).toBe(`notes.${ext}`);
  });

  it.each(Object.keys(FILE_TYPE_FAMILIES))('keeps a custom name ending in its own extension .%s', (ext) => {
    expect(resolveFileName({ custom: `notes.${ext}`, original: `a.${ext}`, extension: ext })).toBe(`notes.${ext}`);
  });

  it('adds the real extension when the suffix is a word or another kind of file', () => {
    expect(resolveFileName({ custom: 'Q3.Numbers', original: 'a.pdf', extension: 'pdf' })).toBe('Q3.Numbers.pdf');
    expect(resolveFileName({ custom: 'Access.Key', original: 'a.pdf', extension: 'pdf' })).toBe('Access.Key.pdf');
    expect(resolveFileName({ custom: 'Invoice Acme.Inc', original: 'a.pdf', extension: 'pdf' })).toBe('Invoice Acme.Inc.pdf');
    expect(resolveFileName({ custom: 'report.docx', original: 'a.pdf', extension: 'pdf' })).toBe('report.docx');
  });

  it('cleans trailing dots and spaces', () => {
    expect(resolveFileName({ custom: 'Report .', original: 'a.pdf', extension: 'pdf' })).toBe('Report.pdf');
    expect(resolveFileName({ custom: 'Report..', original: 'a.pdf', extension: 'pdf' })).toBe('Report.pdf');
    expect(resolveFileName({ custom: ' ... ', original: 'a.pdf', extension: 'pdf' })).toBe('a.pdf');
  });
});
