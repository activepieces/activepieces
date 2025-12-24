"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosHttpClient = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const axios_retry_1 = tslib_1.__importDefault(require("axios-retry"));
const delegating_authentication_converter_1 = require("../core/delegating-authentication-converter");
const base_http_client_1 = require("../core/base-http-client");
const http_error_1 = require("../core/http-error");
class AxiosHttpClient extends base_http_client_1.BaseHttpClient {
    constructor(baseUrl = '', authenticationConverter = new delegating_authentication_converter_1.DelegatingAuthenticationConverter()) {
        super(baseUrl, authenticationConverter);
    }
    sendRequest(request, axiosClient) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const axiosInstance = axiosClient || axios_1.default;
                process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
                const { urlWithoutQueryParams, queryParams: urlQueryParams } = this.getUrl(request);
                const headers = this.getHeaders(request);
                const axiosRequestMethod = this.getAxiosRequestMethod(request.method);
                const timeout = request.timeout ? request.timeout : 0;
                const queryParams = request.queryParams || {};
                const responseType = request.responseType || 'json';
                for (const [key, value] of Object.entries(queryParams)) {
                    urlQueryParams.append(key, value);
                }
                const config = {
                    method: axiosRequestMethod,
                    url: urlWithoutQueryParams,
                    params: urlQueryParams,
                    headers,
                    data: request.body,
                    timeout,
                    responseType,
                };
                if (request.retries && request.retries > 0) {
                    (0, axios_retry_1.default)(axiosInstance, {
                        retries: request.retries,
                        retryDelay: axios_retry_1.default.exponentialDelay,
                        retryCondition: (error) => {
                            return axios_retry_1.default.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 500) || false;
                        },
                    });
                }
                const response = yield axiosInstance.request(config);
                return {
                    status: response.status,
                    headers: response.headers,
                    body: response.data,
                };
            }
            catch (e) {
                if (axios_1.default.isAxiosError(e)) {
                    const httpError = new http_error_1.HttpError(request.body, e);
                    console.error('[HttpClient#(sanitized error message)] Request failed:', httpError);
                    throw httpError;
                }
                throw e;
            }
        });
    }
    getAxiosRequestMethod(httpMethod) {
        return httpMethod.toString();
    }
}
exports.AxiosHttpClient = AxiosHttpClient;
//# sourceMappingURL=axios-http-client.js.map