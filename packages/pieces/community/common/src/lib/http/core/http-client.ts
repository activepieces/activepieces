import { AxiosHttpClient } from '../axios/axios-http-client';
import type { HttpMessageBody } from './http-message-body';
import type { HttpRequest } from './http-request';
import { HttpResponse } from './http-response';

export type HttpClient = {
  sendRequest<
    RequestBody extends HttpMessageBody|string,
    ResponseBody extends HttpMessageBody
  >(
    request: HttpRequest<RequestBody>
  ): Promise<HttpResponse<ResponseBody>>;
};

export const httpClient = new AxiosHttpClient();
