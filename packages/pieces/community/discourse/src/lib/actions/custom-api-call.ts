import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { isRecord, isSameInstanceUrl, normalizeBaseUrl } from '../common/client';
import { discourseNetwork } from '../common/network-guard';

const baseAction = createCustomApiCallAction({
  baseUrl: (auth) => (auth ? normalizeBaseUrl(auth.props.website_url) : ''),
  auth: discourseAuth,
  authMapping: async (auth) => ({
    'Api-Key': auth.props.api_key.trim(),
    'Api-Username': auth.props.api_username.trim(),
  }),
  props: {
    followRedirects: {
      description: 'Not available for Discourse: redirects are never followed so the API key stays on your forum.',
      defaultValue: false,
    },
  },
});

export const discourseCustomApiCall = createAction({
  name: baseAction.name,
  displayName: baseAction.displayName,
  description: baseAction.description,
  auth: discourseAuth,
  audience: 'human',
  classification: 'WRITE',
  props: baseAction.props,
  propertyGroups: baseAction.propertyGroups,
  async run(context) {
    const baseUrl = normalizeBaseUrl(context.auth.props.website_url);
    const rawUrl = isRecord(context.propsValue.url) ? context.propsValue.url['url'] : undefined;
    if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
      throw new Error('Enter the URL or path to call.');
    }
    const target = resolveTarget({ baseUrl, rawUrl: rawUrl.trim() });
    if (!isSameInstanceUrl({ baseUrl, candidate: target })) {
      throw new Error(`Custom API Call only sends the API key to your forum at ${baseUrl}. Use a path such as /latest.json or a full URL on that forum.`);
    }
    await discourseNetwork.assertPublicHost(new URL(baseUrl).hostname);
    const dispatcher = await discourseNetwork.getGuardedDispatcher();
    const forumOrigin = new URL(baseUrl).origin;
    const originalFetch = globalThis.fetch;
    const guardedFetch: typeof fetch = (input, init) => {
      if (requestOrigin(input) !== forumOrigin) {
        return originalFetch(input, init);
      }
      const guardedInit: RequestInit & { dispatcher: unknown } = { ...init, dispatcher };
      return originalFetch(input, guardedInit);
    };
    globalThis.fetch = guardedFetch;
    try {
      return await baseAction.run({
        ...context,
        propsValue: { ...context.propsValue, url: { ...context.propsValue.url, url: target }, followRedirects: false },
      });
    } finally {
      if (globalThis.fetch === guardedFetch) {
        globalThis.fetch = originalFetch;
      }
    }
  },
});

function requestOrigin(input: unknown): string | undefined {
  try {
    if (typeof input === 'string' || input instanceof URL) {
      return new URL(input).origin;
    }
    return input instanceof Request ? new URL(input.url).origin : undefined;
  } catch {
    return undefined;
  }
}

function resolveTarget({ baseUrl, rawUrl }: { baseUrl: string; rawUrl: string }): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(rawUrl) || rawUrl.startsWith('//')) {
    return rawUrl;
  }
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${baseUrl}${path}`;
}
