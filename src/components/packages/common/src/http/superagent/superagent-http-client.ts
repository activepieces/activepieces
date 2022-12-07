import querystring from 'node:querystring';
import type {SuperAgentStatic} from 'superagent';
import superagent from 'superagent';
import type {AuthenticationConverter} from '../core/authentication/authentication-converter';
import {DelegatingAuthenticationConverter} from '../core/authentication/delegating-authentication-converter';
import {BaseHttpClient} from '../core/base-http-client';
import {HttpError} from '../core/http-error';
import type {HttpMessageBody} from '../core/http-message-body';
import {HttpMethod} from '../core/http-method';
import type {HttpRequest} from '../core/http-request';
import type {SuperAgentRequestMethod} from './superagent-request-method';

export class SuperAgentHttpClient extends BaseHttpClient {
	constructor(
		baseUrl = '',
		qs: typeof querystring = querystring,
		authenticationConverter: AuthenticationConverter = new DelegatingAuthenticationConverter(),
		private readonly client: SuperAgentStatic = superagent,
	) {
		super(baseUrl, qs, authenticationConverter);
	}

	async sendRequest<RequestBody extends HttpMessageBody, ResponseBody extends HttpMessageBody>(
		request: HttpRequest<RequestBody>,
	): Promise<ResponseBody> {
		const url = this.getUrl(request);
		const headers = this.getHeaders(request);
		const superagentRequest = this.getSuperagentRequest(request.method);

		const response = await superagentRequest(url)
			.set(headers)
			.send(request.body);

		if (!response.ok) {
			throw new HttpError(url);
		}

		return response.body as ResponseBody;
	}

	private getSuperagentRequest(httpMethod: HttpMethod): SuperAgentRequestMethod {
		const map: Record<HttpMethod, SuperAgentRequestMethod> = {
			[HttpMethod.CONNECT]: this.client.connect,
			[HttpMethod.DELETE]: this.client.delete,
			[HttpMethod.GET]: this.client.get,
			[HttpMethod.HEAD]: this.client.head,
			[HttpMethod.OPTIONS]: this.client.options,
			[HttpMethod.PATCH]: this.client.patch,
			[HttpMethod.POST]: this.client.post,
			[HttpMethod.PUT]: this.client.put,
			[HttpMethod.TRACE]: this.client.trace,
		};

		return map[httpMethod];
	}
}
