import axios, { AxiosStatic } from 'axios';
import { DelegatingAuthenticationConverter } from '../core/delegating-authentication-converter';
import { BaseHttpClient } from '../core/base-http-client';
import { HttpError } from '../core/http-error';
import { HttpHeaders } from '../core/http-headers';
import { HttpMessageBody } from '../core/http-message-body';
import { HttpMethod } from '../core/http-method';
import { HttpRequest } from '../core/http-request';
import { HttpResponse } from '../core/http-response';

export class AxiosHttpClient extends BaseHttpClient {
	constructor(
		baseUrl = '',
		authenticationConverter: DelegatingAuthenticationConverter = new DelegatingAuthenticationConverter(),
		private readonly client: AxiosStatic = axios,
	) {
		super(baseUrl, authenticationConverter);
	}

	async sendRequest<ResponseBody extends HttpMessageBody>(
		request: HttpRequest<HttpMessageBody>
	): Promise<HttpResponse<ResponseBody>> {
		try {
			const url = this.getUrl(request);
			const headers = this.getHeaders(request);
			const axiosRequestMethod = this.getAxiosRequestMethod(request.method);

			const response = await axios.request({
				method: axiosRequestMethod,
				url,
				headers,
				data: request.body,
			})

			return {
				status: response.status,
				headers: response.headers as HttpHeaders,
				body: response.data,
			};
		} catch (e) {
			if (axios.isAxiosError(e)) {
				throw new HttpError(request.body, e);
			}
			throw e;
		}
	}

	private getAxiosRequestMethod(httpMethod: HttpMethod): string {
		return httpMethod.toString();
	}
}
