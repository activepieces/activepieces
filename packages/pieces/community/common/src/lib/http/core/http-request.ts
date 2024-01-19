import type { HttpMessageBody } from './http-message-body';
import type { HttpMethod } from './http-method';
import type { QueryParams } from './query-params';
import { HttpHeaders } from './http-headers';
import { Authentication } from '../../authentication';

export type HttpRequest<RequestBody extends HttpMessageBody = any> = {
  method: HttpMethod;
  url: string;
  body?: RequestBody | undefined;
  headers?: HttpHeaders;
  authentication?: Authentication | undefined;
  queryParams?: QueryParams | undefined;
  timeout?: number;
};
