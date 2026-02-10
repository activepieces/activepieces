import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
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

  async sendRequest<ResponseBody extends HttpMessageBody = any>(
    request: HttpRequest<HttpRequestBody>,
    axiosClient?: AxiosInstance
  ): Promise<HttpResponse<ResponseBody>> {
    try {
      const axiosInstance = axiosClient || axios.create();
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
      const { urlWithoutQueryParams, queryParams: urlQueryParams } =
        this.getUrl(request);
      const headers = this.getHeaders(request);
      const axiosRequestMethod = this.getAxiosRequestMethod(request.method);
      const timeout = request.timeout ? request.timeout : 0;
      const queryParams = request.queryParams || {};
      const responseType = request.responseType || 'json';

      for (const [key, value] of Object.entries(queryParams)) {
        urlQueryParams.append(key, value);
      }

      const config: AxiosRequestConfig = {
        method: axiosRequestMethod,
        url: urlWithoutQueryParams,
        params: urlQueryParams,
        headers,
        data: request.body,
        timeout,
        responseType,
        maxRedirects: request.followRedirects ?? false ? undefined : 0,
        validateStatus: (status) => {
          if (status >= 400) return false;
          if (request.followRedirects ?? false) {
            return status >= 200 && status < 300;
          }
          return status >= 200 && status < 400;
        },
      };

      if (request.retries && request.retries > 0) {
        axiosRetry(axiosInstance, {
          retries: request.retries,
          retryDelay: axiosRetry.exponentialDelay,
          retryCondition: (error) => {
            return (
              axiosRetry.isNetworkOrIdempotentRequestError(error) ||
              (error.response && error.response.status >= 500) ||
              false
            );
          },
        });
      }

      const response = await axiosInstance.request(config);

      return {
        status: response.status,
        headers: response.headers as HttpHeaders,
        body: response.data,
      };
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const httpError = new HttpError(request.body, e);
        console.error(
          '[HttpClient#(sanitized error message)] Request failed:',
          httpError
        );
        throw httpError;
      }
      throw e;
    }
  }

  private getAxiosRequestMethod(httpMethod: HttpMethod): string {
    return httpMethod.toString();
  }
}
