import { URL } from 'node:url';
import type {Authentication} from '../../authentication/core/authentication';
import type {AuthenticationConverter} from './authentication/authentication-converter';
import type {HttpClient} from './http-client';
import {HttpHeader} from './http-header';
import type {HttpMessageBody} from './http-message-body';
import type {HttpRequest} from './http-request';
import {MediaType} from './media-type';
import type {HttpHeaders} from './http-headers';
import { HttpResponse } from './http-response';

export abstract class BaseHttpClient implements HttpClient {
	constructor(
		private readonly baseUrl: string,
		private readonly authenticationConverter: AuthenticationConverter,
	) {}

	abstract sendRequest<ResponseBody extends HttpMessageBody>(
		request: HttpRequest,
	): Promise<HttpResponse<ResponseBody>>;

	protected getUrl(request: HttpRequest): string {
		const url = new URL(`${this.baseUrl}${request.url}`);

		if (request.queryParams) {
			for (const [name, value] of Object.entries(request.queryParams)) {
				url.searchParams.append(name, value);
			}
		}

		return url.toString();
	}

	protected getHeaders(
		request: HttpRequest,
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
