import axios, { AxiosStatic } from 'axios';
import { AuthenticationConverter } from '../core/authentication/authentication-converter';
import { DelegatingAuthenticationConverter } from '../core/authentication/delegating-authentication-converter';
import { BaseHttpClient } from '../core/base-http-client';
import { HttpMessageBody } from '../core/http-message-body';
import { HttpMethod } from '../core/http-method';
import { HttpRequest } from '../core/http-request';

export class AxiosHttpClient extends BaseHttpClient {
	constructor(
		baseUrl = '',
		authenticationConverter: AuthenticationConverter = new DelegatingAuthenticationConverter(),
		private readonly client: AxiosStatic = axios,
	) {
		super(baseUrl, authenticationConverter);
	}

    async sendRequest<ResponseBody extends HttpMessageBody>(
        request: HttpRequest<HttpMessageBody>
    ): Promise<ResponseBody> {
        const url = this.getUrl(request);
		const headers = this.getHeaders(request);
		const axiosRequestMethod = this.getAxiosRequestMethod(request.method);

		const response = await axios.request({
            method: axiosRequestMethod,
            url,
            headers,
            data: request.body,
        })

		return response.data as ResponseBody;
    }

	private getAxiosRequestMethod(httpMethod: HttpMethod): string {
		return httpMethod.toString();
	}
}
