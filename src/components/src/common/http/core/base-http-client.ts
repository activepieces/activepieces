import type querystring from 'node:querystring';
import type {Authentication} from '../../../authentication/core/authentication';
import type {AuthenticationConverter} from './authentication/authentication-converter';
import type {HttpClient} from './http-client';
import {HttpHeader} from './http-header';
import type {HttpMessageBody} from './http-message-body';
import type {HttpRequest} from './http-request';
import {MediaType} from './media-type';
import type {RequestHeaders} from './request-headers';

export abstract class BaseHttpClient implements HttpClient {
	constructor(
		private readonly baseUrl: string,
		private readonly qs: typeof querystring,
		private readonly authenticationConverter: AuthenticationConverter,
	) {}

	abstract sendRequest<RequestBody extends HttpMessageBody, ResponseBody extends HttpMessageBody>(
		request: HttpRequest<RequestBody>,
	): Promise<ResponseBody>;

	protected getUrl<RequestBody extends HttpMessageBody>(request: HttpRequest<RequestBody>): string {
		const base = this.baseUrl;
		const path = request.url;
		const query = this.qs.encode(request.queryParams);
		return `${base}${path}?${query}`;
	}

	protected getHeaders<RequestBody extends HttpMessageBody>(
		request: HttpRequest<RequestBody>,
	): RequestHeaders {
		const requestHeaders: RequestHeaders = {
			[HttpHeader.ACCEPT]: MediaType.APPLICATION_JSON,
		};

		if (request.authentication) {
			this.populateAuthentication(request.authentication, requestHeaders);
		}

		if (request.body) {
			requestHeaders[HttpHeader.CONTENT_TYPE] = MediaType.APPLICATION_JSON;
		}

		return requestHeaders;
	}

	private populateAuthentication(authentication: Authentication, headers: RequestHeaders): void {
		this.authenticationConverter.convert(authentication, headers);
	}
}
