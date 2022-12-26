import type {RequestHeaders} from '../request-headers';
import type {AuthenticationConverter} from './authentication-converter';
import {BearerTokenAuthenticationConverter} from './bearer-authentication-converter';
import {AuthenticationType} from "../../../authentication/core/authentication-type";
import {Authentication} from "../../../authentication/core/authentication";

export class DelegatingAuthenticationConverter implements AuthenticationConverter {
	private readonly converters: Record<AuthenticationType, AuthenticationConverter>;

	constructor(
		bearerTokenConverter = new BearerTokenAuthenticationConverter(),
	) {
		this.converters = {
			[AuthenticationType.BEARER_TOKEN]: bearerTokenConverter,
		};
	}

	convert(authentication: Authentication, headers: RequestHeaders): RequestHeaders {
		const converter = this.converters[authentication.type];
		return converter.convert(authentication, headers);
	}
}
