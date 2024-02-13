import axios, { AxiosRequestConfig, AxiosStatic } from 'axios';
import { DelegatingAuthenticationConverter } from '../core/delegating-authentication-converter';
import { BaseHttpClient } from '../core/base-http-client';
import { HttpError } from '../core/http-error';
import { HttpHeaders } from '../core/http-headers';
import { HttpMessageBody } from '../core/http-message-body';
import { HttpMethod } from '../core/http-method';
import { HttpRequest } from '../core/http-request';
import { HttpResponse } from '../core/http-response';
import { HttpRequestBody } from '../core/http-request-body';

export class AxiosHttpClient extends BaseHttpClient {
  constructor(
    baseUrl = '',
    authenticationConverter: DelegatingAuthenticationConverter = new DelegatingAuthenticationConverter()
  ) {
    super(baseUrl, authenticationConverter);
  }

  async sendRequest<ResponseBody extends HttpMessageBody>(
    request: HttpRequest<HttpRequestBody>
  ): Promise<HttpResponse<ResponseBody>> {
    try {
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
      const { urlWithoutQueryParams, queryParams } = this.getUrl(request);
      const headers = this.getHeaders(request);
      const axiosRequestMethod = this.getAxiosRequestMethod(request.method);
      const timeout = request.timeout ? request.timeout : 0;
      const config: AxiosRequestConfig = {
        method: axiosRequestMethod,
        url: urlWithoutQueryParams,
        params: {
          ...queryParams,
          ...request.queryParams,
        },
        headers,
        data: request.body,
        timeout,
      };

      const response = await axios.request(config);

      return {
        status: response.status,
        headers: response.headers as HttpHeaders,
        body: response.data,
      };
    } catch (e) {
      console.error('[HttpClient#sendRequest] error:', e);
      if (axios.isAxiosError(e)) {
        console.error(
          '[HttpClient#sendRequest] error, responseStatus:',
          e.response?.status
        );
        console.error(
          '[HttpClient#sendRequest] error, responseBody:',
          e.response?.data
        );

        throw new HttpError(request.body, e);
      }

      throw e;
    }
  }

  private getAxiosRequestMethod(httpMethod: HttpMethod): string {
    return httpMethod.toString();
  }
}
