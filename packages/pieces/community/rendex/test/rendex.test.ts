import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rendex } from '../src/index';
import { rendexAuth } from '../src/lib/common/auth';
import { RendexApiError, rendexClient } from '../src/lib/common/client';
import { renderToImage } from '../src/lib/actions/render-to-image';
import { renderScreenshot } from '../src/lib/actions/render-screenshot';
import { createRenderLink } from '../src/lib/actions/create-render-link';
import { extractContent } from '../src/lib/actions/extract-content';
import { createArtifact } from '../src/lib/actions/create-artifact';
import { getAccount } from '../src/lib/actions/get-account';
import { listWatches } from '../src/lib/actions/list-watches';
import { getWatch } from '../src/lib/actions/get-watch';
import { createWatch } from '../src/lib/actions/create-watch';
import { testWatch } from '../src/lib/actions/test-watch';
import { updateWatch } from '../src/lib/actions/update-watch';
import { deleteWatch } from '../src/lib/actions/delete-watch';
import { runWatchNow } from '../src/lib/actions/run-watch-now';
import { listWatchRuns } from '../src/lib/actions/list-watch-runs';
import { newWatchChange } from '../src/lib/triggers/new-watch-change';
import { renderScreenshotOutputSchema } from '../src/lib/common/output-schemas';

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

const AUTH = { type: AppConnectionType.SECRET_TEXT, secret_text: ' rdx_testkey ' };
const IMAGE = Buffer.from('png-bytes').toString('base64');
const SECRET_HTML = '<p>secret-customer-ssn-123</p>';
const EXTRACTED = { format: 'markdown', content: '## Report\n\nHello **world**.', excerpt: 'Hello world.', length: 23 };

function ok({ data, meta }: { data: unknown; meta?: unknown }) {
  return { status: 200, headers: {}, body: { success: true, data, meta: meta ?? { requestId: 'req_1', timestamp: '2026-11-05T00:00:00Z' } } };
}

function httpError({ status, body, requestBody }: { status: number; body: unknown; requestBody?: unknown }) {
  return new HttpError(requestBody ?? '[redacted]', { status, responseBody: body });
}

function vendorError({ code, message, details }: { code: string; message: string; details?: unknown }) {
  return { success: false, error: { code, message, details }, meta: { requestId: 'req_err', timestamp: '2026-11-05T00:00:00Z' } };
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    store: {
      get: async (key: string): Promise<unknown> => data.get(key) ?? null,
      put: async (key: string, value: unknown): Promise<unknown> => {
        data.set(key, value);
        return value;
      },
      delete: async (key: string): Promise<void> => {
        data.delete(key);
      },
    },
  };
}

function filesStub() {
  return { write: vi.fn(async ({ fileName }: { fileName: string; data: Buffer }) => `https://files.local/${fileName}`) };
}

function call<T>({ fn, ctx }: { fn: (ctx: never) => Promise<T>; ctx: unknown }): Promise<T> {
  return Reflect.apply(fn, undefined, [ctx]);
}

function actionContext({ propsValue, files }: { propsValue: Record<string, unknown>; files?: ReturnType<typeof filesStub> }) {
  return { auth: AUTH, propsValue, store: memoryStore().store, files: files ?? filesStub() };
}

function request({ index }: { index: number }) {
  return sendRequest.mock.calls[index][0];
}

function validate({ auth }: { auth: string }) {
  return rendexAuth.validate?.({
    auth,
    server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => 'x' },
  });
}

async function caught({ promise }: { promise: Promise<unknown> }): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to fail');
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('piece metadata', () => {
  it('requires the 0.86.4 floor and registers every action and the trigger', () => {
    expect(rendex.minimumSupportedRelease).toBe('0.86.4');
    expect(Object.keys(rendex.actions()).sort()).toEqual([
      'create_artifact', 'create_render_link', 'create_watch', 'custom_api_call', 'delete_watch', 'extract_content',
      'get_account', 'get_watch', 'list_watch_runs', 'list_watches', 'render_screenshot', 'render_to_image',
      'run_watch_now', 'test_watch', 'update_watch',
    ]);
    expect(Object.keys(rendex.triggers())).toEqual(['new_watch_change']);
  });

  it('demotes render_to_image to human and keeps its props, values and defaults', () => {
    expect(renderToImage.audience).toBe('human');
    expect(renderToImage.classification).toBe('READ');
    expect(renderScreenshot.classification).toBe('READ');
    expect(Object.keys(renderToImage.props)).toEqual(['source_type', 'content', 'format', 'full_page']);
    expect(renderToImage.props.source_type.defaultValue).toBe('html');
    expect(renderToImage.props.source_type.options.options.map((option) => option.value)).toEqual(['html', 'url', 'markdown']);
    expect(renderToImage.props.format.options.options.map((option) => option.value)).toEqual(['png', 'jpeg', 'webp', 'pdf']);
    expect(renderToImage.props.format.defaultValue).toBe('png');
    expect(renderToImage.props.full_page.defaultValue).toBe(false);
    expect(renderScreenshot.audience).toBe('ai');
  });

  it('names only registered display names in aiMetadata prose', () => {
    const names = new Set([
      ...Object.values(rendex.actions()).map((action) => action.displayName),
      ...Object.values(rendex.triggers()).map((trigger) => trigger.displayName),
    ]);
    const mentioned = ['Render Screenshot', 'Create Render Link', 'Extract Page Content', 'Create Branded Document', 'Get Account Usage', 'List Watches', 'Get Watch', 'Create Watch', 'Test Watch Settings', 'Update Watch', 'Delete Watch', 'Run Watch Check Now', 'List Watch Runs', 'Watch Detected a Change'];
    for (const name of mentioned) {
      expect(names.has(name)).toBe(true);
    }
    const agentActions = Object.values(rendex.actions()).filter((action) => action.audience === 'ai' || action.audience === 'both');
    expect(agentActions).toHaveLength(13);
    for (const action of agentActions) {
      for (const prop of Object.values(action.props)) {
        expect(prop.type).not.toBe('CHECKBOX');
      }
    }
  });
});

describe('client', () => {
  it('sends a trimmed bearer key, Accept JSON, a verified-TLS dispatcher, no redirects, no retries and redacted bodies', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { plan: 'free' } }));
    await call({ fn: getAccount.run, ctx: actionContext({ propsValue: {} }) });
    const [req, options] = sendRequest.mock.calls[0];
    expect(req.method).toBe('GET');
    expect(req.url).toBe('https://api.rendex.dev/v1/account');
    expect(req.headers).toEqual({ Accept: 'application/json', Authorization: 'Bearer rdx_testkey' });
    expect(req.followRedirects).toBe(false);
    expect(req.redactBodyInErrors).toBe(true);
    expect(req.retries).toBe(0);
    expect(req.timeout).toBe(30_000);
    expect(req.body).toBeUndefined();
    expect(options.dispatcher.constructor.name).toBe('Agent');
  });

  it('maps the vendor envelope into RendexApiError with responseBody and never echoes the request body', async () => {
    const body = vendorError({ code: 'VALIDATION_ERROR', message: 'Invalid request', details: [{ path: ['width'], message: 'Too small' }] });
    sendRequest.mockRejectedValueOnce(httpError({ status: 400, body, requestBody: { html: SECRET_HTML } }));
    const error = await caught({ promise: call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { html: SECRET_HTML } }) }) });
    expect(error).toBeInstanceOf(RendexApiError);
    if (!(error instanceof RendexApiError)) return;
    expect(error.message).toBe('Rendex could not render the screenshot (HTTP 400 VALIDATION_ERROR): Invalid request. Details: width: Too small. Request ID: req_err.');
    expect(error.message).not.toContain('secret-customer');
    expect(error.status).toBe(400);
    expect(error.responseBody).toEqual(body);
    expect(Reflect.has(error, 'body')).toBe(false);
  });

  it('adds a hint for disabled keys, rate limits, quota, timeouts and paused watches', async () => {
    const cases = [
      { status: 403, code: 'KEY_DISABLED', expected: 'disabled or revoked' },
      { status: 429, code: 'RATE_LIMITED', expected: 'per-minute request limit' },
      { status: 429, code: 'USAGE_EXCEEDED', expected: 'retrying will not help' },
      { status: 408, code: 'TIMEOUT', expected: 'Raise Timeout' },
      { status: 409, code: 'WATCH_PAUSED', expected: 'Resume the watch with Update Watch' },
    ];
    for (const { status, code, expected } of cases) {
      sendRequest.mockRejectedValueOnce(httpError({ status, body: vendorError({ code, message: 'Nope' }) }));
      await expect(call({ fn: getAccount.run, ctx: actionContext({ propsValue: {} }) })).rejects.toThrow(expected);
    }
  });

  it('fails a 2xx response whose envelope says success false, or that is not JSON', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: vendorError({ code: 'CAPTURE_FAILED', message: 'Render failed' }) });
    await expect(call({ fn: getAccount.run, ctx: actionContext({ propsValue: {} }) })).rejects.toThrow('(HTTP 200 CAPTURE_FAILED): Render failed.');
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: '<html>gateway</html>' });
    await expect(call({ fn: getAccount.run, ctx: actionContext({ propsValue: {} }) })).rejects.toThrow('not a JSON object');
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: undefined });
    await expect(call({ fn: getAccount.run, ctx: actionContext({ propsValue: {} }) })).rejects.toThrow('response was empty');
  });

  it('treats a 3xx as an error and reports an abort as a timeout without retrying', async () => {
    sendRequest.mockResolvedValueOnce({ status: 302, headers: {}, body: undefined });
    await expect(call({ fn: getAccount.run, ctx: actionContext({ propsValue: {} }) })).rejects.toThrow('redirect');
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    sendRequest.mockRejectedValueOnce(abort);
    await expect(call({ fn: getAccount.run, ctx: actionContext({ propsValue: {} }) })).rejects.toThrow('did not answer within 30 s');
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('refuses an empty API key before sending', async () => {
    await expect(call({ fn: getAccount.run, ctx: { ...actionContext({ propsValue: {} }), auth: { type: AppConnectionType.SECRET_TEXT, secret_text: '  ' } } })).rejects.toThrow('no API key');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('url-encodes watch ids in paths', async () => {
    expect(rendexClient.segment({ value: 'a/b?c', label: 'Watch' })).toBe('a%2Fb%3Fc');
    expect(() => rendexClient.segment({ value: '..', label: 'Watch' })).toThrow('Watch is required');
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'a/b' } }));
    await call({ fn: getWatch.run, ctx: actionContext({ propsValue: { watch_id: 'a/b' } }) });
    expect(request({ index: 0 }).url).toBe('https://api.rendex.dev/v1/watches/a%2Fb');
  });
});

describe('auth validate', () => {
  it('accepts a good key through GET /v1/account', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { plan: 'free' } }));
    expect(await validate({ auth: ' rdx_good ' })).toEqual({ valid: true });
    expect(request({ index: 0 }).url).toBe('https://api.rendex.dev/v1/account');
    expect(request({ index: 0 }).headers.Authorization).toBe('Bearer rdx_good');
    expect(sendRequest.mock.calls[0][1].dispatcher).toBeDefined();
  });

  it('names 401 INVALID_API_KEY, but never calls a disabled key, 429, 5xx or network failure an invalid key', async () => {
    expect(await validate({ auth: '' })).toEqual({ valid: false, error: 'Enter your Rendex API key (it starts with rdx_).' });
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: vendorError({ code: 'INVALID_API_KEY', message: 'Invalid API key' }) }));
    const rejected = await validate({ auth: 'rdx_bad' });
    expect(rejected).toMatchObject({ valid: false });
    expect(rejected).toEqual({ valid: false, error: 'Rendex could not read your account to check the API key (HTTP 401 INVALID_API_KEY): Invalid API key. Check the API key on the Rendex connection (keys start with rdx_). Request ID: req_err.' });

    const others = [
      httpError({ status: 403, body: vendorError({ code: 'KEY_DISABLED', message: 'Key disabled' }) }),
      httpError({ status: 429, body: vendorError({ code: 'RATE_LIMITED', message: 'Slow down' }) }),
      httpError({ status: 503, body: 'Service Unavailable' }),
      new TypeError('fetch failed'),
    ];
    for (const failure of others) {
      sendRequest.mockRejectedValueOnce(failure);
      const result = await validate({ auth: 'rdx_any' });
      expect(result).toMatchObject({ valid: false });
      expect(JSON.stringify(result)).not.toContain('rejected the API key');
    }
  });
});

describe('render_to_image (human)', () => {
  it('sends the same body as main and returns main output keys plus usage', async () => {
    const files = filesStub();
    sendRequest.mockResolvedValueOnce(ok({
      data: { image: IMAGE, contentType: 'image/png', width: 1280, height: 800, format: 'png', bytesSize: 9, capturedAt: '2026-11-05T00:00:00Z', quality: 'full', waitStrategy: 'networkidle2', loadTimeMs: 120, renderingEngine: 'chromium' },
      meta: { requestId: 'req_1', usage: { credits: 1, remaining: 99 } },
    }));
    const output = await call({ fn: renderToImage.run, ctx: actionContext({ propsValue: { source_type: 'html', content: { html: '<h1>Hi</h1>' }, format: undefined, full_page: undefined }, files }) });
    expect(request({ index: 0 }).url).toBe('https://api.rendex.dev/v1/screenshot/json');
    expect(request({ index: 0 }).body).toEqual({ html: '<h1>Hi</h1>', format: 'png', fullPage: false, waitUntil: 'load' });
    expect(request({ index: 0 }).timeout).toBe(90_000);
    expect(files.write).toHaveBeenCalledWith({ fileName: 'rendex-capture.png', data: Buffer.from('png-bytes') });
    expect(output).toEqual({
      file: 'https://files.local/rendex-capture.png', contentType: 'image/png', width: 1280, height: 800, format: 'png', bytesSize: 9,
      capturedAt: '2026-11-05T00:00:00Z', quality: 'full', waitStrategy: 'networkidle2', loadTimeMs: 120, renderingEngine: 'chromium',
      usage: { credits: 1, remaining: 99 },
    });
  });

  it('keeps main validation for missing content and fails a 2xx without image data', async () => {
    await expect(call({ fn: renderToImage.run, ctx: actionContext({ propsValue: { source_type: 'url', content: {} } }) })).rejects.toThrow('Please provide content for the selected source.');
    sendRequest.mockResolvedValueOnce(ok({ data: { format: 'png' } }));
    await expect(call({ fn: renderToImage.run, ctx: actionContext({ propsValue: { source_type: 'url', content: { url: 'https://example.com' }, format: 'jpeg', full_page: true } }) })).rejects.toThrow('no image data');
    expect(request({ index: 0 }).body).toEqual({ url: 'https://example.com', format: 'jpeg', fullPage: true });
  });
});

describe('render_screenshot (ai)', () => {
  it('refuses zero sources, two sources and template data with a URL before any request', async () => {
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: {} }) })).rejects.toThrow('All three are empty');
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { url: 'https://example.com', html: '<p>x</p>' } }) })).rejects.toThrow('You gave URL and HTML');
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { url: 'https://a.com', html: '<p/>', markdown: '# x' } }) })).rejects.toThrow('URL and HTML and Markdown');
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { url: 'https://example.com', template_data: { name: 'Ada' } } }) })).rejects.toThrow('Template Data only works with HTML or Markdown');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('refuses out-of-range numbers, bad choices and oversized HTML before any request', async () => {
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { url: 'https://a.com', width: 100 } }) })).rejects.toThrow('Width must be a whole number from 320 to 3840');
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { url: 'https://a.com', format: 'gif' } }) })).rejects.toThrow('Format must be one of');
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { url: 'https://a.com', block_ads: 'maybe' } }) })).rejects.toThrow('Block Ads must be "yes" or "no"');
    await expect(call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { html: 'x'.repeat(5 * 1024 * 1024 + 1) } }) })).rejects.toThrow('HTML is 5,242,881 bytes; Rendex accepts at most 5,242,880 bytes (5 MB).');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('maps every option to the vendor body, leaves unset options out and writes the file', async () => {
    const files = filesStub();
    sendRequest.mockResolvedValueOnce(ok({ data: { image: IMAGE, format: 'jpeg', extracted: EXTRACTED }, meta: { usage: { credits: 1, remaining: 50 } } }));
    const output = await call({
      fn: renderScreenshot.run,
      ctx: actionContext({
        files,
        propsValue: {
          html: '<p>{{name}}</p>', template_data: { name: 'Ada' }, format: 'jpeg', width: '800', height: 600, full_page: 'yes',
          selector: ' h1 ', device: 'iphone_15', wait_until: 'load', timeout_seconds: 20, block_cookie_banners: 'no',
          hide_selectors: ['.ad', ' ', '.chat'], wait_for_selector: '#ready', delay_ms: 500, dark_mode: 'yes', block_ads: 'no',
          quality: 70, pdf_format: undefined, pdf_landscape: undefined, extract_text: 'yes', extract_format: 'markdown',
        },
      }),
    });
    expect(request({ index: 0 }).body).toEqual({
      html: '<p>{{name}}</p>', data: { name: 'Ada' }, format: 'jpeg', width: 800, height: 600, fullPage: true, selector: 'h1',
      device: 'iphone_15', waitUntil: 'load', timeout: 20, blockCookieBanners: false, hideSelectors: ['.ad', '.chat'],
      waitForSelector: '#ready', delay: 500, darkMode: true, blockAds: false, quality: 70, extract: true, extractFormat: 'markdown',
    });
    expect(request({ index: 0 }).timeout).toBe(50_500);
    expect(files.write).toHaveBeenCalledWith({ fileName: 'rendex-screenshot.jpeg', data: Buffer.from('png-bytes') });
    expect(output).toEqual({ file: 'https://files.local/rendex-screenshot.jpeg', format: 'jpeg', extracted: EXTRACTED, usage: { credits: 1, remaining: 50 } });
    const extractedField = renderScreenshotOutputSchema.fields.find((field) => field.key === 'extracted');
    expect(Object.keys(Reflect.get(Object(output), 'extracted')).sort()).toEqual((extractedField?.children ?? []).map((child) => child.key).sort());
  });

  it('sends only the source when nothing else is set', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { image: IMAGE, format: 'png' } }));
    await call({ fn: renderScreenshot.run, ctx: actionContext({ propsValue: { markdown: '# Title', extract_format: 'json' } }) });
    expect(request({ index: 0 }).body).toEqual({ markdown: '# Title', waitUntil: 'load' });
    expect(request({ index: 0 }).timeout).toBe(90_000);
  });
});

describe('other render actions', () => {
  it('defaults Wait Until to load for inline sources and keeps an explicit choice', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { url: 'https://api.rendex.dev/v1/render?p=1', expiresAt: 'x', format: 'png', cacheTtl: 1 } }));
    await call({ fn: createRenderLink.run, ctx: actionContext({ propsValue: { html: '<h1>Hi</h1>', device: 'pixel_8' } }) });
    expect(request({ index: 0 }).body).toEqual({ html: '<h1>Hi</h1>', waitUntil: 'load', device: 'pixel_8' });
    sendRequest.mockResolvedValueOnce(ok({ data: { url: 'https://api.rendex.dev/v1/render?p=2', expiresAt: 'x', format: 'png', cacheTtl: 1 } }));
    await call({ fn: createRenderLink.run, ctx: actionContext({ propsValue: { markdown: '# Hi', wait_until: 'networkidle0' } }) });
    expect(request({ index: 1 }).body).toEqual({ markdown: '# Hi', waitUntil: 'networkidle0' });
    sendRequest.mockResolvedValueOnce(ok({ data: { image: IMAGE, format: 'png' } }));
    await call({ fn: renderToImage.run, ctx: actionContext({ propsValue: { source_type: 'markdown', content: { markdown: '# Hi' }, format: 'png', full_page: false } }) });
    expect(request({ index: 2 }).body).toEqual({ markdown: '# Hi', format: 'png', fullPage: false, waitUntil: 'load' });
  });

  it('create_render_link sends the source, options and expiresIn', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { url: 'https://api.rendex.dev/v1/render?p=1', expiresAt: '2026-12-05T00:00:00Z', format: 'png', cacheTtl: 86400 } }));
    const output = await call({ fn: createRenderLink.run, ctx: actionContext({ propsValue: { url: ' https://example.com ', full_page: 'no', expires_in_seconds: 3600 } }) });
    expect(request({ index: 0 }).url).toBe('https://api.rendex.dev/v1/render/link');
    expect(request({ index: 0 }).body).toEqual({ url: 'https://example.com', fullPage: false, expiresIn: 3600 });
    expect(output).toEqual({ url: 'https://api.rendex.dev/v1/render?p=1', expiresAt: '2026-12-05T00:00:00Z', format: 'png', cacheTtl: 86400 });
    await expect(call({ fn: createRenderLink.run, ctx: actionContext({ propsValue: { url: 'https://a.com', expires_in_seconds: 60 } }) })).rejects.toThrow('Expires In (seconds) must be a whole number from 3600 to 2592000');
  });

  it('extract_content sends the extract body and surfaces 422 EXTRACTION_FAILED', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { url: 'https://example.com', format: 'markdown', content: '# Hi', loadTimeMs: 300 }, meta: { usage: { credits: 1, remaining: 9 } } }));
    const output = await call({ fn: extractContent.run, ctx: actionContext({ propsValue: { url: 'https://example.com', extract_format: 'markdown', timeout_seconds: 10, hide_selectors: [] } }) });
    expect(request({ index: 0 }).body).toEqual({ url: 'https://example.com', extractFormat: 'markdown', timeout: 10 });
    expect(request({ index: 0 }).timeout).toBe(40_000);
    expect(output).toEqual({ url: 'https://example.com', format: 'markdown', content: '# Hi', loadTimeMs: 300, usage: { credits: 1, remaining: 9 } });
    sendRequest.mockRejectedValueOnce(httpError({ status: 422, body: vendorError({ code: 'EXTRACTION_FAILED', message: 'No readable content' }) }));
    await expect(call({ fn: extractContent.run, ctx: actionContext({ propsValue: { url: 'https://example.com/x.png' } }) })).rejects.toThrow('(HTTP 422 EXTRACTION_FAILED): No readable content.');
  });

  it('create_artifact nests branding and page setup and validates formats', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { pdfUrl: 'https://x/a.pdf', shareUrl: 'https://x/s', expiresAt: '2026-11-06T00:00:00Z' } }));
    await call({
      fn: createArtifact.run,
      ctx: actionContext({ propsValue: { content: '# Report', input_format: 'markdown', formats: ['pdf'], accent_color: '#4f46e5', header: 'ACME', page_size: 'Letter', orientation: 'landscape', template_data: { a: 1 }, expires_in_seconds: 7200 } }),
    });
    expect(request({ index: 0 }).url).toBe('https://api.rendex.dev/v1/artifact');
    expect(request({ index: 0 }).body).toEqual({
      content: '# Report', inputFormat: 'markdown', formats: ['pdf'], branding: { accentColor: '#4f46e5', header: 'ACME' },
      pageSetup: { size: 'Letter', orientation: 'landscape' }, data: { a: 1 }, expiresIn: 7200,
    });
    await expect(call({ fn: createArtifact.run, ctx: actionContext({ propsValue: { content: '# R', formats: ['docx'] } }) })).rejects.toThrow('Output Formats accepts pdf and png');
    await expect(call({ fn: createArtifact.run, ctx: actionContext({ propsValue: { content: '   ' } }) })).rejects.toThrow('Content is required');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });
});

describe('watch actions', () => {
  it('list_watches sends status, limit and cursor and returns hasMore', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [{ id: 'w1' }], nextCursor: 'c2' } }));
    const output = await call({ fn: listWatches.run, ctx: actionContext({ propsValue: { status: 'paused', limit: '5', cursor: ' c1 ' } }) });
    expect(request({ index: 0 }).queryParams).toEqual({ status: 'paused', limit: '5', cursor: 'c1' });
    expect(output).toEqual({ items: [{ id: 'w1' }], nextCursor: 'c2', hasMore: true });
    await expect(call({ fn: listWatches.run, ctx: actionContext({ propsValue: { limit: 500 } }) })).rejects.toThrow('Limit must be a whole number from 1 to 100');
  });

  it('create_watch sends settings at top level and render settings under renderParams', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://httpbin.org/uuid' } }));
    await call({
      fn: createWatch.run,
      ctx: actionContext({ propsValue: { url: 'https://httpbin.org/uuid', name: 'UUID', interval_minutes: 1440, diff_mode: 'text', threshold: '0.05', paused: 'no', full_page: 'no', ignore_text: ['/\\d+/'] } }),
    });
    expect(request({ index: 0 }).method).toBe('POST');
    expect(request({ index: 0 }).body).toEqual({
      url: 'https://httpbin.org/uuid', name: 'UUID', intervalMinutes: 1440, paused: false, diffMode: 'text', threshold: 0.05,
      renderParams: { fullPage: false, ignoreText: ['/\\d+/'] },
    });
    await expect(call({ fn: createWatch.run, ctx: actionContext({ propsValue: { url: 'https://a.com', interval_minutes: 2 } }) })).rejects.toThrow('from 5 to 43200');
  });

  it('test_watch posts to /v1/watches/test', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { ok: true, reachable: true } }));
    expect(await call({ fn: testWatch.run, ctx: actionContext({ propsValue: { url: 'https://a.com', diff_mode: 'both' } }) })).toEqual({ ok: true, reachable: true });
    expect(request({ index: 0 }).url).toBe('https://api.rendex.dev/v1/watches/test');
    expect(request({ index: 0 }).body).toEqual({ url: 'https://a.com', diffMode: 'both' });
  });

  it('update_watch sends only filled fields, null for clears, and pause/resume as booleans', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 'w1' } }));
    await call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', paused: 'pause' } }) });
    expect(request({ index: 0 }).method).toBe('PATCH');
    expect(request({ index: 0 }).body).toEqual({ paused: true });
    await call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', paused: 'resume', clear_name: 'yes', clear_notify_email: 'no', webhook_url: 'https://hook.example.com' } }) });
    expect(request({ index: 1 }).body).toEqual({ paused: false, name: '', webhookUrl: 'https://hook.example.com' });
    await call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', clear_notify_email: 'yes', clear_webhook_url: 'yes' } }) });
    expect(request({ index: 2 }).body).toEqual({ notifyEmail: null, webhookUrl: null });
    sendRequest.mockClear();
    await call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', paused: 'keep', name: 'New', selector: '#price' } }) });
    expect(request({ index: 0 }).body).toEqual({ name: 'New', renderParams: { selector: '#price' } });
    expect(Object.keys(request({ index: 0 }).body)).not.toContain('paused');
  });

  it('update_watch clears the element selector, hidden elements and ignored text, and fails when Rendex keeps them', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', renderParams: { fullPage: true, selector: '', hideSelectors: [], ignoreText: [] } } }));
    const output = await call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', clear_selector: 'yes', clear_hide_selectors: 'yes', clear_ignore_text: 'yes', hide_selectors: [] } }) });
    expect(request({ index: 0 }).body).toEqual({ renderParams: { selector: '', hideSelectors: [], ignoreText: [] } });
    expect(output).toEqual({ id: 'w1', renderParams: { fullPage: true, selector: '', hideSelectors: [], ignoreText: [] } });
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', renderParams: { hideSelectors: ['.ad'], ignoreText: [] } } }));
    await expect(call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', clear_hide_selectors: 'yes', clear_ignore_text: 'yes', clear_selector: 'no' } }) })).rejects.toThrow('Rendex saved the other changes but kept Hide Elements.');
    await expect(call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', selector: '#a', clear_selector: 'yes' } }) })).rejects.toThrow('Either set Element Selector or set Clear Element Selector to yes');
    await expect(call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', ignore_text: ['x'], clear_ignore_text: 'yes' } }) })).rejects.toThrow('Either set Ignore Text or set Clear Ignore Text to yes');
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('update_watch refuses an empty patch and a value with its clear option', async () => {
    await expect(call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', paused: 'keep', clear_name: 'no', hide_selectors: [] } }) })).rejects.toThrow('Nothing to update');
    await expect(call({ fn: updateWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1', name: 'x', clear_name: 'yes' } }) })).rejects.toThrow('Either set Name or set Clear Name to yes');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('delete_watch sends DELETE without a body, accepts 204 and surfaces a repeat 404', async () => {
    sendRequest.mockResolvedValueOnce({ status: 204, headers: {}, body: undefined });
    expect(await call({ fn: deleteWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1' } }) })).toEqual({ deleted: true, id: 'w1' });
    expect(request({ index: 0 }).method).toBe('DELETE');
    expect(request({ index: 0 }).body).toBeUndefined();
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: vendorError({ code: 'WATCH_NOT_FOUND', message: 'Watch not found' }) }));
    await expect(call({ fn: deleteWatch.run, ctx: actionContext({ propsValue: { watch_id: 'w1' } }) })).rejects.toThrow('(HTTP 404 WATCH_NOT_FOUND)');
  });

  it('run_watch_now posts an empty object and list_watch_runs pages with a cursor', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { runId: 'r1', watchId: 'w1', status: 'queued' } }));
    expect(await call({ fn: runWatchNow.run, ctx: actionContext({ propsValue: { watch_id: 'w1' } }) })).toEqual({ runId: 'r1', watchId: 'w1', status: 'queued' });
    expect(request({ index: 0 }).url).toBe('https://api.rendex.dev/v1/watches/w1/run');
    expect(request({ index: 0 }).body).toEqual({});
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [{ id: 'r1' }], nextCursor: null } }));
    expect(await call({ fn: listWatchRuns.run, ctx: actionContext({ propsValue: { watch_id: 'w1', limit: 1, cursor: 'c9' } }) })).toEqual({ items: [{ id: 'r1' }], nextCursor: null, hasMore: false });
    expect(request({ index: 1 }).url).toBe('https://api.rendex.dev/v1/watches/w1/runs');
    expect(request({ index: 1 }).queryParams).toEqual({ limit: '1', cursor: 'c9' });
  });

  it('the watch dropdown follows the cursor and shows the error instead of an empty list', async () => {
    const dropdown = getWatch.props.watch_id;
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [{ id: 'w1', url: 'https://a.com', name: 'A', status: 'active' }], nextCursor: 'c2' } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [{ id: 'w2', url: 'https://b.com', name: null, status: 'paused' }], nextCursor: null } }));
    const options = await dropdown.options({ auth: AUTH }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' } });
    expect(options.options).toEqual([
      { label: 'A (https://a.com) [active]', value: 'w1' },
      { label: 'https://b.com [paused]', value: 'w2' },
    ]);
    expect(request({ index: 1 }).queryParams).toEqual({ status: 'all', limit: '100', cursor: 'c2' });
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: vendorError({ code: 'INVALID_API_KEY', message: 'Invalid API key' }) }));
    const failed = await dropdown.options({ auth: AUTH }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' } });
    expect(failed.disabled).toBe(true);
    expect(failed.placeholder).toContain('HTTP 401');
  });
});

describe('new_watch_change trigger', () => {
  const NOW = Date.parse('2026-11-05T12:00:00Z');

  function runAt({ id, created, completed, status, changed }: { id: string; created: number; completed: number | null; status: string; changed: boolean | null }) {
    return {
      id, watchId: 'w1', status, changed,
      createdAt: new Date(created).toISOString(),
      completedAt: completed === null ? null : new Date(completed).toISOString(),
    };
  }

  const STATE = 'rendex_watch_poll_state';

  function seeded({ scannedThrough, seen }: { scannedThrough?: number; seen?: string[] } = {}) {
    const memory = memoryStore();
    memory.data.set(STATE, { since: NOW, scannedThrough: scannedThrough ?? NOW, seen: seen ?? [] });
    return memory;
  }

  function stateIn({ data }: { data: Map<string, unknown> }) {
    return Object(data.get(STATE));
  }

  function triggerContext({ store, fireOn }: { store: ReturnType<typeof memoryStore>['store']; fireOn?: string }) {
    return { auth: AUTH, propsValue: { watch_id: 'w1', fire_on: fireOn }, store, files: {} };
  }

  it('onEnable stores the checkpoint only and makes no request', async () => {
    const { store, data } = memoryStore();
    await call({ fn: newWatchChange.onEnable, ctx: triggerContext({ store }) });
    expect(typeof stateIn({ data }).since).toBe('number');
    expect(stateIn({ data }).seen).toEqual([]);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('pages back with the cursor to the checkpoint, emits each changed run once and never twice', async () => {
    const { store } = seeded();
    const fresh = runAt({ id: 'r3', created: NOW + 60_000, completed: NOW + 70_000, status: 'completed', changed: true });
    const unchanged = runAt({ id: 'r2', created: NOW + 30_000, completed: NOW + 40_000, status: 'completed', changed: false });
    const queued = runAt({ id: 'r4', created: NOW + 80_000, completed: null, status: 'queued', changed: null });
    const old = runAt({ id: 'r1', created: NOW - 3_600_000, completed: NOW - 3_590_000, status: 'completed', changed: true });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [queued, fresh], nextCursor: 'c2' } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [unchanged, old], nextCursor: 'c3' } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const first = await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) });
    expect(first).toEqual([{ ...fresh, watch: { id: 'w1', url: 'https://a.com', name: 'A' } }]);
    expect(request({ index: 0 }).queryParams).toEqual({ limit: '100' });
    expect(request({ index: 1 }).queryParams).toEqual({ limit: '100', cursor: 'c2' });
    expect(request({ index: 2 }).url).toBe('https://api.rendex.dev/v1/watches/w1');
    expect(sendRequest).toHaveBeenCalledTimes(3);

    sendRequest.mockResolvedValueOnce(ok({ data: { items: [queued, fresh, unchanged, old], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
  });

  it('fires on failed checks or every finished check when chosen', async () => {
    const failed = runAt({ id: 'f1', created: NOW + 1000, completed: NOW + 2000, status: 'failed', changed: null });
    const done = runAt({ id: 'd1', created: NOW + 3000, completed: NOW + 4000, status: 'completed', changed: false });
    for (const { fireOn, expected } of [{ fireOn: 'failed', expected: ['f1'] }, { fireOn: 'completed', expected: ['d1'] }]) {
      const { store } = seeded();
      sendRequest.mockResolvedValueOnce(ok({ data: { items: [done, failed], nextCursor: null } }));
      sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: null } }));
      const items = await call({ fn: newWatchChange.run, ctx: triggerContext({ store, fireOn }) });
      expect(items.map((item) => Reflect.get(Object(item), 'id'))).toEqual(expected);
    }
  });

  it('throws when the page cap is reached with a cursor still set, instead of truncating', async () => {
    const { store, data } = seeded();
    const recent = runAt({ id: 'r', created: NOW + 1000, completed: NOW + 2000, status: 'completed', changed: true });
    let page = 0;
    sendRequest.mockImplementation(async () => {
      page += 1;
      return ok({ data: { items: [recent], nextCursor: `c${page}` } });
    });
    await expect(call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).rejects.toThrow('More than 2000 watch runs');
    expect(sendRequest).toHaveBeenCalledTimes(20);
    expect(stateIn({ data })).toEqual({ since: NOW, scannedThrough: NOW, seen: [] });
  });

  it('advances its scanned-through marker over many polls with only unchanged runs, then fires a change exactly once', async () => {
    const { store, data } = seeded();
    const history: ReturnType<typeof runAt>[] = [];
    let clock = NOW;
    sendRequest.mockImplementation(async (req: { url: string; queryParams: Record<string, string> }) => {
      if (!req.url.endsWith('/runs')) {
        return ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } });
      }
      const start = req.queryParams['cursor'] === undefined ? 0 : Number(req.queryParams['cursor']);
      const next = start + 100 < history.length ? String(start + 100) : null;
      return ok({ data: { items: history.slice(start, start + 100), nextCursor: next } });
    });
    for (let poll = 0; poll < 30; poll++) {
      for (let index = 0; index < 80; index++) {
        clock += 60_000;
        history.unshift(runAt({ id: `u${poll}-${index}`, created: clock, completed: clock + 5_000, status: 'completed', changed: false }));
      }
      sendRequest.mockClear();
      expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
      expect(sendRequest.mock.calls.length).toBeLessThanOrEqual(1);
    }
    expect(history.length).toBe(2400);
    expect(stateIn({ data }).scannedThrough).toBe(clock);

    clock += 60_000;
    const change = runAt({ id: 'c1', created: clock, completed: clock + 5_000, status: 'completed', changed: true });
    history.unshift(change);
    const fired = await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) });
    expect(fired).toEqual([{ ...change, watch: { id: 'w1', url: 'https://a.com', name: 'A' } }]);
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
  });

  it('holds the marker behind a queued run and emits it once it finishes, without re-emitting on overlap', async () => {
    const { store, data } = seeded();
    const queued = runAt({ id: 'q1', created: NOW + 60_000, completed: null, status: 'queued', changed: null });
    const later = runAt({ id: 'u1', created: NOW + 20 * 60_000, completed: NOW + 20 * 60_000 + 5_000, status: 'completed', changed: false });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [later, queued], nextCursor: null } }));
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
    expect(stateIn({ data }).scannedThrough).toBe(NOW + 60_000);
    const done = { ...queued, status: 'completed', changed: true, completedAt: new Date(NOW + 25 * 60_000).toISOString() };
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [later, done], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const fired = await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) });
    expect(fired.map((item) => Reflect.get(Object(item), 'id'))).toEqual(['q1']);
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [later, done], nextCursor: null } }));
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
  });

  it('writes no state when the watch lookup fails, so the run is emitted on the next poll exactly once', async () => {
    const { store, data } = seeded({ seen: ['r0'] });
    const change = runAt({ id: 'r1', created: NOW + 60_000, completed: NOW + 70_000, status: 'completed', changed: true });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [change], nextCursor: null } }));
    sendRequest.mockRejectedValueOnce(httpError({ status: 429, body: vendorError({ code: 'RATE_LIMITED', message: 'Slow down' }) }));
    await expect(call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).rejects.toThrow('HTTP 429 RATE_LIMITED');
    expect(stateIn({ data })).toEqual({ since: NOW, scannedThrough: NOW, seen: ['r0'] });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [change], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const second = await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) });
    expect(second.map((item) => Reflect.get(Object(item), 'id'))).toEqual(['r1']);
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [change], nextCursor: null } }));
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
  });

  it('emits a run that finishes after a newer run was emitted, and a failed run without completedAt', async () => {
    const { store } = seeded();
    const slow = runAt({ id: 's1', created: NOW + 60_000, completed: null, status: 'processing', changed: null });
    const quick = runAt({ id: 'q1', created: NOW + 90_000, completed: NOW + 200_000, status: 'completed', changed: true });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [quick, slow], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const first = await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) });
    expect(first.map((item) => Reflect.get(Object(item), 'id'))).toEqual(['q1']);
    const slowDone = { ...slow, status: 'completed', changed: true, completedAt: new Date(NOW + 150_000).toISOString() };
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [quick, slowDone], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const second = await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) });
    expect(second.map((item) => Reflect.get(Object(item), 'id'))).toEqual(['s1']);

    const failStore = seeded().store;
    const pending = runAt({ id: 'f1', created: NOW + 10_000, completed: null, status: 'queued', changed: null });
    const other = runAt({ id: 'o1', created: NOW + 20_000, completed: NOW + 900_000, status: 'failed', changed: null });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [other, pending], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    await call({ fn: newWatchChange.run, ctx: triggerContext({ store: failStore, fireOn: 'failed' }) });
    const failedNoTime = { ...pending, status: 'failed', completedAt: null };
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [other, failedNoTime], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const failed = await call({ fn: newWatchChange.run, ctx: triggerContext({ store: failStore, fireOn: 'failed' }) });
    expect(failed.map((item) => Reflect.get(Object(item), 'id'))).toEqual(['f1']);
  });

  it('onEnable forgets an old marker unless the flow is only republished', async () => {
    const { store, data } = seeded({ scannedThrough: 1, seen: ['x'] });
    await call({ fn: newWatchChange.onEnable, ctx: { ...triggerContext({ store }), isRepublish: true } });
    expect(stateIn({ data })).toEqual({ since: NOW, scannedThrough: 1, seen: ['x'] });
    await call({ fn: newWatchChange.onEnable, ctx: triggerContext({ store }) });
    expect(stateIn({ data }).seen).toEqual([]);
    expect(stateIn({ data }).since).toBeGreaterThan(NOW);
  });

  it('keeps every run for the next poll when the checkpoint write fails, then emits it exactly once', async () => {
    const { store, data } = seeded({ seen: ['r0'] });
    const change = runAt({ id: 'r1', created: NOW + 60_000, completed: NOW + 70_000, status: 'completed', changed: true });
    const failingStore = { ...store, put: async () => { throw new Error('store unavailable'); } };
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [change], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    await expect(call({ fn: newWatchChange.run, ctx: triggerContext({ store: failingStore }) })).rejects.toThrow('store unavailable');
    expect(stateIn({ data })).toEqual({ since: NOW, scannedThrough: NOW, seen: ['r0'] });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [change], nextCursor: null } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const retried = await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) });
    expect(retried.map((item) => Reflect.get(Object(item), 'id'))).toEqual(['r1']);
    expect(stateIn({ data }).seen).toEqual(['r1', 'r0']);
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [change], nextCursor: null } }));
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
  });

  it('skips runs that finished before the trigger was enabled and starts fresh when no checkpoint exists', async () => {
    const { store, data } = seeded();
    const before = runAt({ id: 'b1', created: NOW - 120_000, completed: NOW - 60_000, status: 'completed', changed: true });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [before], nextCursor: null } }));
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).toEqual([]);
    expect(stateIn({ data }).seen).toEqual(['b1']);
    const empty = memoryStore();
    expect(await call({ fn: newWatchChange.run, ctx: triggerContext({ store: empty.store }) })).toEqual([]);
    expect(stateIn({ data: empty.data }).seen).toEqual([]);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('lets an API failure fail the poll instead of returning nothing', async () => {
    const { store } = seeded();
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: vendorError({ code: 'INTERNAL_ERROR', message: 'Boom' }) }));
    await expect(call({ fn: newWatchChange.run, ctx: triggerContext({ store }) })).rejects.toThrow('HTTP 500 INTERNAL_ERROR');
  });

  it('test reads one small page and does not page back through history', async () => {
    const { store } = memoryStore();
    const run = runAt({ id: 'r1', created: NOW, completed: NOW + 1000, status: 'completed', changed: true });
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [run], nextCursor: 'more' } }));
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'w1', url: 'https://a.com', name: 'A' } }));
    const items = await call({ fn: newWatchChange.test, ctx: triggerContext({ store }) });
    expect(items).toHaveLength(1);
    expect(request({ index: 0 }).queryParams).toEqual({ limit: '10' });
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });
});
