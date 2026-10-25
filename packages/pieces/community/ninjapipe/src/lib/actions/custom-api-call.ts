import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';

const baseAction = createCustomApiCallAction({
  baseUrl: (auth) => (auth ? ninjapipeClient.readAuth(auth).baseUrl : ''),
  auth: ninjapipeAuth,
  authMapping: async (auth) => ({
    Authorization: `Bearer ${ninjapipeClient.readAuth(auth).apiKey}`,
  }),
});

export const ninjapipeCustomApiCall = createAction({
  auth: ninjapipeAuth,
  name: 'custom_api_call',
  displayName: baseAction.displayName,
  description: 'Sends an authenticated request to the NinjaPipe API of the connected workspace. The URL must be a path or a URL on the connected API Base URL.',
  props: baseAction.props,
  propertyGroups: baseAction.propertyGroups,
  errorHandlingOptions: baseAction.errorHandlingOptions,
  classification: 'WRITE',
  audience: 'human',
  aiMetadata: {
    description: 'Send a raw authenticated request to the NinjaPipe REST API of the connected workspace, for endpoints no other step covers. The URL must stay on the connection API Base URL.',
    idempotent: false,
  },
  async run(context) {
    const { baseUrl } = ninjapipeClient.readAuth(context.auth);
    const url = ninjapipeClient.isRecord(context.propsValue.url) ? context.propsValue.url['url'] : undefined;
    assertSameApi({ url, baseUrl });
    return baseAction.run(context);
  },
});

function assertSameApi({ url, baseUrl }: { url: unknown; baseUrl: string }): void {
  if (typeof url !== 'string') throw new Error('URL is required.');
  const value = url.trim();
  if (!/^https?:\/\//i.test(value)) {
    if (value.startsWith('//') || value.includes('..') || value.includes('\\')) {
      throw new Error('URL must be a path under the connected NinjaPipe API Base URL.');
    }
    return;
  }
  const target = new URL(value);
  const base = new URL(baseUrl);
  const basePath = base.pathname.replace(/\/+$/, '');
  const pathOk = target.pathname === basePath || target.pathname.startsWith(`${basePath}/`);
  if (target.origin !== base.origin || target.username || target.password || !pathOk || target.pathname.includes('..')) {
    throw new Error(`URL must be on the connected NinjaPipe API (${base.origin}${basePath}). Requests to other hosts are refused because they would carry your API key.`);
  }
}
