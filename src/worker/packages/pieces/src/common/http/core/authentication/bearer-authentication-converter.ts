import type {BearerTokenAuthentication} from '../../../authentication/bearer-token/bearer-token-authentication';
import {HttpHeader} from '../http-header';
import type {RequestHeaders} from '../request-headers';
import type {AuthenticationConverter} from './authentication-converter';

export class BearerTokenAuthenticationConverter implements AuthenticationConverter {
	convert(authentication: BearerTokenAuthentication, headers: RequestHeaders): RequestHeaders {
		headers[HttpHeader.AUTHORIZATION] = `Bearer ${authentication.token}`;
		return headers;
	}
}
