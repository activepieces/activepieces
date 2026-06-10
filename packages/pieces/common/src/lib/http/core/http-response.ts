import { HttpMessageBody } from './http-message-body';
import { HttpHeaders } from './http-headers';

export type HttpResponse<RequestBody extends HttpMessageBody = any> = {
  status: number;
  headers?: HttpHeaders | undefined;
  body: RequestBody;
};
