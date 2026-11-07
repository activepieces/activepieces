import { createHmac, timingSafeEqual } from 'crypto';
import { HttpMethod, httpClient, HttpError } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

// Blog Automation Customer API (https://app.blog-automation.com/api/v1/ext). BA_API_BASE overrides the host (staging, tests).
export const baseUrl = (): string => (process.env['BA_API_BASE'] || 'https://app.blog-automation.com/api/v1/ext').replace(/\/+$/, '');

const keyOf = (auth: unknown): string => (typeof auth === 'string' ? auth : String((auth as { secret_text?: string })?.secret_text ?? ''));

export const blogAutomationAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Create a key in Blog Automation under **Entwickler / API** (starts with \`ba_live_\`, Starter and Pro plans). Scopes: \`articles:read\`, \`articles:write\`, \`articles:publish\`, \`ai:generate\`, \`ideas:write\`, \`account:read\` and \`webhooks:write\` (instant triggers).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await baRequest(auth, HttpMethod.GET, '/me');
      return { valid: true };
    } catch (e) {
      return { valid: false, error: errorText(e) };
    }
  },
});

export function errorText(e: unknown): string {
  const err = e as HttpError & { response?: { status?: number; body?: { message?: string; error?: string } } };
  const body = err?.response?.body;
  return body?.message || body?.error || (err as Error)?.message || 'Request failed';
}

export async function baRequest<T = any>(auth: unknown, method: HttpMethod, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
  try {
    const res = await httpClient.sendRequest<T>({
      method, url: `${baseUrl()}${path}`, body: body as any, queryParams: query,
      headers: { Authorization: `Bearer ${keyOf(auth)}`, Accept: 'application/json', 'Accept-Language': 'en' },
    });
    return res.body;
  } catch (e) {
    const err = e as { response?: { status?: number } };
    throw new Error(`Blog Automation${err?.response?.status ? ` (${err.response.status})` : ''}: ${errorText(e)}`);
  }
}

/** only filled fields */
export const clean = (o: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

/** X-BA-Signature: t=<unix>,sha256=<hex HMAC-SHA256(secret, "<t>.<raw body>")>, max. `tolerance` seconds old */
export function verifySignature(secret: string, header: string | undefined, rawBody: string, now = Date.now(), tolerance = 300): boolean {
  const m = /^t=(\d+),sha256=([0-9a-f]{64})$/.exec(String(header || ''));
  if (!m || Math.abs(now / 1000 - Number(m[1])) > tolerance) return false;
  const want = createHmac('sha256', secret).update(`${m[1]}.${rawBody}`).digest();
  return timingSafeEqual(want, Buffer.from(m[2], 'hex'));
}

// ---------- dropdowns ----------
type Opt = { label: string; value: number | string };
const dropdown = (displayName: string, required: boolean, load: (auth: unknown) => Promise<Opt[]>, description?: string) =>
  Property.Dropdown({
    auth: blogAutomationAuth, displayName, description, required, refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Connect your Blog Automation account first.' };
      try { return { disabled: false, options: await load(auth) }; } catch (e) { return { disabled: true, options: [], placeholder: errorText(e) }; }
    },
  });

export const props = {
  article: (required = true) => dropdown('Article', required, async (auth) =>
    (await baRequest<{ data: { id: number; title: string; status: string }[] }>(auth, HttpMethod.GET, '/articles', undefined, { limit: '100' })).data.map((a) => ({ label: `${a.title} – ${a.status}`, value: a.id }))),
  site: () => dropdown('WordPress Site', false, async (auth) =>
    (await baRequest<{ data: { id: number; name: string; url: string }[] }>(auth, HttpMethod.GET, '/sites', undefined, { limit: '100' })).data.map((s) => ({ label: `${s.name} (${s.url})`, value: s.id })),
  'Only needed when the article has no site yet / to pick the target site.'),
  idea: () => dropdown('Idea', false, async (auth) =>
    (await baRequest<{ data: { id: number; title: string }[] }>(auth, HttpMethod.GET, '/ideas', undefined, { limit: '100', status: 'new,planned' })).data.map((i) => ({ label: i.title, value: i.id })),
  'Write the article from an idea of the idea board (marks it as used; the key needs ideas:write).'),
  template: () => dropdown('Template', false, async (auth) =>
    (await baRequest<{ data: { id: string; name: string }[] }>(auth, HttpMethod.GET, '/templates')).data.map((t) => ({ label: t.name, value: t.id }))),
  language: () => Property.ShortText({ displayName: 'Language', description: 'Two-letter code, e.g. en or de. Default: the site language.', required: false }),
};

export const sampleArticle = {
  id: 1042, title: 'How to plan a content calendar', status: 'published', previousStatus: 'publishing', siteId: 1, language: 'en',
  scheduledAt: '2026-11-06T09:00:00.000Z', publishedAt: '2026-11-06T09:00:12.000Z', wpPostId: 381, wpUrl: 'https://blog.example.com/content-calendar/',
  aiGenerated: true, wordCount: 1180, created: '2026-11-05T15:20:00.000Z', updated: '2026-11-06T09:00:12.000Z',
};
