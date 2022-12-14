import { AxiosHttpClient } from '../axios/axios-http-client';
import type {HttpMessageBody} from './http-message-body';
import type {HttpRequest} from './http-request';

export type HttpClient = {
	sendRequest<RequestBody extends HttpMessageBody, ResponseBody extends HttpMessageBody>(
		request: HttpRequest<RequestBody>,
	): Promise<ResponseBody>;
};

export const httpClient = new AxiosHttpClient();
