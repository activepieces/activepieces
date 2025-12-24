import { DelegatingAuthenticationConverter } from './delegating-authentication-converter';
import type { HttpClient } from './http-client';
import type { HttpHeaders } from './http-headers';
import type { HttpMessageBody } from './http-message-body';
import type { HttpRequest } from './http-request';
import { HttpRequestBody } from './http-request-body';
import { HttpResponse } from './http-response';
export declare abstract class BaseHttpClient implements HttpClient {
    private readonly baseUrl;
    private readonly authenticationConverter;
    constructor(baseUrl: string, authenticationConverter: DelegatingAuthenticationConverter);
    abstract sendRequest<RequestBody extends HttpMessageBody, ResponseBody extends HttpMessageBody>(request: HttpRequest<RequestBody>): Promise<HttpResponse<ResponseBody>>;
    protected getUrl<RequestBody extends HttpMessageBody>(request: HttpRequest<RequestBody>): {
        urlWithoutQueryParams: string;
        queryParams: URLSearchParams;
    };
    protected getHeaders<RequestBody extends HttpRequestBody>(request: HttpRequest<RequestBody>): HttpHeaders;
    private populateAuthentication;
}
