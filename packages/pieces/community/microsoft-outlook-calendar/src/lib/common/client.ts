import { Client, GraphRequest } from '@microsoft/microsoft-graph-client';

import { QueryParams } from '@activepieces/pieces-common';

import type { OutlookCalendarAuthValue } from './types';

function graphUrl({ auth }: { auth: OutlookCalendarAuthValue }): string {
  const host = auth.props?.cloud ?? COMMERCIAL_LOGIN_HOST;
  return GRAPH_BASE_URLS[host] ?? GRAPH_BASE_URLS[COMMERCIAL_LOGIN_HOST];
}

function baseUrl({ auth }: { auth: OutlookCalendarAuthValue }): string {
  return `${graphUrl({ auth })}/v1.0/me`;
}

function create({ auth }: { auth: OutlookCalendarAuthValue }): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: () => Promise.resolve(auth.access_token),
    },
    baseUrl: graphUrl({ auth }),
  });
}

function list({
  auth,
  path,
  query,
  pageUrl,
}: {
  auth: OutlookCalendarAuthValue;
  path: string;
  query?: QueryParams;
  pageUrl: string | undefined;
}): GraphRequest {
  if (!pageUrl) {
    return create({ auth })
      .api(path)
      .query(
        Object.fromEntries(
          Object.entries(query ?? {}).map(([key, value]) => [key, encodeURIComponent(value)]),
        ),
      );
  }
  if (!pageUrl.startsWith(`${graphUrl({ auth })}/v1.0/`)) {
    throw new Error(
      'Page URL must be the @odata.nextLink or @odata.deltaLink returned by a previous call of this action.',
    );
  }
  return create({ auth }).api(pageUrl);
}

export const outlookCalendarClient = { baseUrl, create, list };

const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';

const GRAPH_BASE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://graph.microsoft.com',
  'login.microsoftonline.us': 'https://graph.microsoft.us',
};
