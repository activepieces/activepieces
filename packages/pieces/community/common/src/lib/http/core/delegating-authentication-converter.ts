import type { HttpHeaders } from './http-headers';
import { HttpHeader } from './http-header';
import {
  Authentication,
  AuthenticationType,
  BasicAuthentication,
  BearerTokenAuthentication,
} from '../../authentication';

export class DelegatingAuthenticationConverter
  implements AuthenticationConverter<Authentication>
{
  private readonly converters: Record<
    AuthenticationType,
    AuthenticationConverter<any>
  >;

  constructor(
    bearerTokenConverter = new BearerTokenAuthenticationConverter(),
    basicTokenConverter = new BasicTokenAuthenticationConverter()
  ) {
    this.converters = {
      [AuthenticationType.BEARER_TOKEN]: bearerTokenConverter,
      [AuthenticationType.BASIC]: basicTokenConverter,
    };
  }

  convert(authentication: Authentication, headers: HttpHeaders): HttpHeaders {
    const converter = this.converters[authentication.type];
    return converter.convert(authentication, headers);
  }
}

class BearerTokenAuthenticationConverter
  implements AuthenticationConverter<BearerTokenAuthentication>
{
  convert(
    authentication: BearerTokenAuthentication,
    headers: HttpHeaders
  ): HttpHeaders {
    headers[HttpHeader.AUTHORIZATION] = `Bearer ${authentication.token}`;
    return headers;
  }
}

class BasicTokenAuthenticationConverter
  implements AuthenticationConverter<BasicAuthentication>
{
  convert(
    authentication: BasicAuthentication,
    headers: HttpHeaders
  ): HttpHeaders {
    const credentials = `${authentication.username}:${authentication.password}`;
    const encoded = Buffer.from(credentials).toString('base64');
    headers[HttpHeader.AUTHORIZATION] = `Basic ${encoded}`;
    return headers;
  }
}

type AuthenticationConverter<T extends Authentication> = {
  convert: (authentication: T, headers: HttpHeaders) => HttpHeaders;
};
