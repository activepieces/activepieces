import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

import { simplyprintSession } from '../auth';
import { BASE_URL } from './base-url';

async function simplyprintCall<T extends Record<string, unknown> = Record<string, unknown>>(
  opts: SimplyprintCallOptions,
): Promise<SimplyprintResponse<T>> {
  const { auth, method, path, body, queryParams, company } = opts;

  const { headers, companyId: resolvedCompany } = await simplyprintSession.resolveCall(auth);
  const companyId = company !== undefined ? company : resolvedCompany;

  const res = await httpClient.sendRequest<SimplyprintResponse<T>>({
    method,
    url: `${BASE_URL.api}/${companyId}/${path.replace(/^\//, '')}`,
    headers,
    body,
    queryParams,
  });

  if (!res.body || res.body.status === false) {
    const msg = res.body?.message;
    throw new Error(msg ?? `SimplyPrint ${method} ${path} failed (HTTP ${res.status}).`);
  }

  return res.body;
}

export const simplyprintClient = {
  simplyprintCall,
};

export interface SimplyprintCallOptions {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  path: string;
  body?: HttpMessageBody;
  queryParams?: QueryParams;
  // Override the URL-path company segment. When omitted, the endpoint is
  // scoped to the connection's bound company. Pass `0` for endpoints that
  // don't require a company.
  company?: number | 0;
}

// SimplyPrint's AjaxBaseController::respond() flattens $this->objects into the
// top-level response — so endpoint-specific fields like `data`, `webhook`,
// `user`, `company` sit at the top level alongside `status`/`message`, NOT
// nested under `objects`.
export type SimplyprintResponse<T = Record<string, unknown>> = {
  status: boolean;
  message?: string;
} & T;
