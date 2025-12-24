"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHttpClient = void 0;
const http_header_1 = require("./http-header");
const media_type_1 = require("./media-type");
class BaseHttpClient {
    constructor(baseUrl, authenticationConverter) {
        this.baseUrl = baseUrl;
        this.authenticationConverter = authenticationConverter;
    }
    getUrl(request) {
        const url = new URL(`${this.baseUrl}${request.url}`);
        const urlWithoutQueryParams = `${url.origin}${url.pathname}`;
        const queryParams = new URLSearchParams();
        // Extract query parameters
        url.searchParams.forEach((value, key) => {
            queryParams.append(key, value);
        });
        return {
            urlWithoutQueryParams,
            queryParams,
        };
    }
    getHeaders(request) {
        var _a;
        let requestHeaders = {
            [http_header_1.HttpHeader.ACCEPT]: media_type_1.MediaType.APPLICATION_JSON,
        };
        if (request.authentication) {
            this.populateAuthentication(request.authentication, requestHeaders);
        }
        if (request.body) {
            switch ((_a = request.headers) === null || _a === void 0 ? void 0 : _a['Content-Type']) {
                case 'text/csv':
                    requestHeaders[http_header_1.HttpHeader.CONTENT_TYPE] = media_type_1.MediaType.TEXT_CSV;
                    break;
                default:
                    requestHeaders[http_header_1.HttpHeader.CONTENT_TYPE] = media_type_1.MediaType.APPLICATION_JSON;
                    break;
            }
        }
        if (request.headers) {
            requestHeaders = Object.assign(Object.assign({}, requestHeaders), request.headers);
        }
        return requestHeaders;
    }
    populateAuthentication(authentication, headers) {
        this.authenticationConverter.convert(authentication, headers);
    }
}
exports.BaseHttpClient = BaseHttpClient;
//# sourceMappingURL=base-http-client.js.map