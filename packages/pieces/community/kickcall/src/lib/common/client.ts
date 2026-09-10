import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { KICKCALL_BASE_URL } from './constants';
import { kickcallResponse } from './response';

const MAX_PAGINATION_PAGES = 1000;

async function bearerRequest<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: KickcallAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${KICKCALL_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.props.apiKey,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
  return response.body;
}

async function bearerRequestAllPages({
  auth,
  path,
  queryParams,
}: {
  auth: KickcallAuth;
  path: string;
  queryParams?: Record<string, string>;
}): Promise<{ data: unknown[] }> {
  const rows: unknown[] = [];
  let page = 1;
  const perPage = kickcallResponse.requestedPerPage(queryParams);
  while (page <= MAX_PAGINATION_PAGES) {
    const payload = await bearerRequest({
      auth,
      method: HttpMethod.GET,
      path,
      queryParams: {
        ...queryParams,
        per_page: String(perPage),
        page: String(page),
      },
    });
    const pageRows = kickcallResponse.collectionRows(payload);
    rows.push(...pageRows);
    if (
      kickcallResponse.isLastCollectionPage({
        page,
        pageRowsLength: pageRows.length,
        perPage,
        totalPagesFromMeta: kickcallResponse.totalPages(payload),
      })
    ) {
      return { data: rows };
    }
    page += 1;
  }
  throw new Error(
    `Kickcall list stopped after ${MAX_PAGINATION_PAGES} pages (${rows.length} items). Results are incomplete.`,
  );
}

async function marketplaceRequest<T extends HttpMessageBody>({
  auth,
  path,
  body,
}: {
  auth: KickcallAuth;
  path: string;
  body: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${KICKCALL_BASE_URL}${path}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: {
      ...body,
      apiKey: auth.props.apiKey,
    },
  });
  return response.body;
}

export const kickcallClient = {
  bearerRequest,
  bearerRequestAllPages,
  marketplaceRequest,
  namedOptionsFromCollection: kickcallResponse.namedOptionsFromCollection,
};

export type KickcallAuth = AppConnectionValueForAuthProperty<typeof kickcallAuth>;
