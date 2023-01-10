import type {Authentication} from '../../authentication/core/authentication';
import type {AuthenticationConverter} from './authentication/authentication-converter';
import type {HttpClient} from './http-client';
import {HttpHeader} from './http-header';
import type {HttpMessageBody} from './http-message-body';
import type {HttpRequest} from './http-request';
import {MediaType} from './media-type';
import type {HttpHeaders} from './http-headers';

export abstract class BaseHttpClient implements HttpClient {
	constructor(
		private readonly baseUrl: string,
		private readonly authenticationConverter: AuthenticationConverter,
	) {}

	abstract sendRequest<RequestBody extends HttpMessageBody, ResponseBody extends HttpMessageBody>(
		request: HttpRequest<RequestBody>,
	): Promise<ResponseBody>;

	protected getUrl<RequestBody extends HttpMessageBody>(request: HttpRequest<RequestBody>): string {
		const base = this.baseUrl;
		const path = request.url;
		const query = new URLSearchParams(request.queryParams).toString();
		return `${base}${path}?${query}`;
	}

	protected getHeaders<RequestBody extends HttpMessageBody>(
		request: HttpRequest<RequestBody>,
	): HttpHeaders {
		let requestHeaders: HttpHeaders = {
			[HttpHeader.ACCEPT]: MediaType.APPLICATION_JSON,
		};

		if (request.authentication) {
			this.populateAuthentication(request.authentication, requestHeaders);
		}

		if (request.body) {
			requestHeaders[HttpHeader.CONTENT_TYPE] = MediaType.APPLICATION_JSON;
		}
		if(request.headers){
			requestHeaders = {...requestHeaders, ...request.headers};
		}
		return requestHeaders;
	}

	private populateAuthentication(authentication: Authentication, headers: HttpHeaders): void {
		this.authenticationConverter.convert(authentication, headers);
	}
}
