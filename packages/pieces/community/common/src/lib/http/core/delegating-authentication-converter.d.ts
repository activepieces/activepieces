import type { HttpHeaders } from './http-headers';
import { Authentication, BasicAuthentication, BearerTokenAuthentication } from '../../authentication';
export declare class DelegatingAuthenticationConverter implements AuthenticationConverter<Authentication> {
    private readonly converters;
    constructor(bearerTokenConverter?: BearerTokenAuthenticationConverter, basicTokenConverter?: BasicTokenAuthenticationConverter);
    convert(authentication: Authentication, headers: HttpHeaders): HttpHeaders;
}
declare class BearerTokenAuthenticationConverter implements AuthenticationConverter<BearerTokenAuthentication> {
    convert(authentication: BearerTokenAuthentication, headers: HttpHeaders): HttpHeaders;
}
declare class BasicTokenAuthenticationConverter implements AuthenticationConverter<BasicAuthentication> {
    convert(authentication: BasicAuthentication, headers: HttpHeaders): HttpHeaders;
}
type AuthenticationConverter<T extends Authentication> = {
    convert: (authentication: T, headers: HttpHeaders) => HttpHeaders;
};
export {};
