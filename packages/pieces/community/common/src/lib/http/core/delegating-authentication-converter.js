"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegatingAuthenticationConverter = void 0;
const http_header_1 = require("./http-header");
const authentication_1 = require("../../authentication");
class DelegatingAuthenticationConverter {
    constructor(bearerTokenConverter = new BearerTokenAuthenticationConverter(), basicTokenConverter = new BasicTokenAuthenticationConverter()) {
        this.converters = {
            [authentication_1.AuthenticationType.BEARER_TOKEN]: bearerTokenConverter,
            [authentication_1.AuthenticationType.BASIC]: basicTokenConverter,
        };
    }
    convert(authentication, headers) {
        const converter = this.converters[authentication.type];
        return converter.convert(authentication, headers);
    }
}
exports.DelegatingAuthenticationConverter = DelegatingAuthenticationConverter;
class BearerTokenAuthenticationConverter {
    convert(authentication, headers) {
        headers[http_header_1.HttpHeader.AUTHORIZATION] = `Bearer ${authentication.token}`;
        return headers;
    }
}
class BasicTokenAuthenticationConverter {
    convert(authentication, headers) {
        const credentials = `${authentication.username}:${authentication.password}`;
        const encoded = Buffer.from(credentials).toString('base64');
        headers[http_header_1.HttpHeader.AUTHORIZATION] = `Basic ${encoded}`;
        return headers;
    }
}
//# sourceMappingURL=delegating-authentication-converter.js.map