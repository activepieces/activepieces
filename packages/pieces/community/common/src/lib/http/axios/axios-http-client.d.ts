import { AxiosInstance } from 'axios';
import { DelegatingAuthenticationConverter } from '../core/delegating-authentication-converter';
import { BaseHttpClient } from '../core/base-http-client';
import { HttpMessageBody } from '../core/http-message-body';
import { HttpRequest } from '../core/http-request';
import { HttpResponse } from '../core/http-response';
import { HttpRequestBody } from '../core/http-request-body';
export declare class AxiosHttpClient extends BaseHttpClient {
    constructor(baseUrl?: string, authenticationConverter?: DelegatingAuthenticationConverter);
    sendRequest<ResponseBody extends HttpMessageBody = any>(request: HttpRequest<HttpRequestBody>, axiosClient?: AxiosInstance): Promise<HttpResponse<ResponseBody>>;
    private getAxiosRequestMethod;
}
