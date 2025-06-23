import type { HttpMethod } from './http-method';
import type { QueryParams } from './query-params';
import { HttpHeaders } from './http-headers';
import { Authentication } from '../../authentication';
import { HttpRequestBody } from './http-request-body';

export type HttpRequest<RequestBody extends HttpRequestBody = any> = {
  method: HttpMethod;
  url: string;
  body?: RequestBody | undefined;
  headers?: HttpHeaders;
  authentication?: Authentication | undefined;
  queryParams?: QueryParams | undefined;
  timeout?: number;
  retries?: number;
  responseType?: 'arraybuffer' | 'json' | 'blob' | 'text';
};
