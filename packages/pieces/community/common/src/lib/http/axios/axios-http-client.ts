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
      const axiosInstance = axiosClient || axios;
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
      const { urlWithoutQueryParams, queryParams: urlQueryParams } = this.getUrl(request);
      const headers = this.getHeaders(request);
      const axiosRequestMethod = this.getAxiosRequestMethod(request.method);
      const timeout = request.timeout ? request.timeout : 0;
      const queryParams = request.queryParams || {}
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
      };

      if (request.retries && request.retries > 0) {
        axiosRetry(axiosInstance, {
          retries: request.retries,
          retryDelay: axiosRetry.exponentialDelay,
          retryCondition: (error) => {
            return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 500) || false;
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
        // Log only essential debugging information - NO sensitive data
        const sanitizedError = this.sanitizeAxiosError(e);
        console.error(
          '[HttpClient#sendRequest] Request failed:',
          sanitizedError
        );

        // Sanitize the error before throwing to prevent secrets in error messages
        throw new HttpError(request.body, sanitizedError);
      }

      throw e;
    }
  }


  private sanitizeAxiosError(error: AxiosError): AxiosError {
    const sanitizedError: any = {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    };

    // Sanitize config
    if (error.config) {
      sanitizedError.config = {
        ...error.config,
        headers: this.sanitizeHeaders(error.config.headers),
      };
    }

    // Sanitize request - this is the critical part that was missing
    if (error.request) {
      sanitizedError.request = {
        // Only include safe properties
        method: error.request.method,
        path: error.request.path,
        host: error.request.host,
        protocol: error.request.protocol,
        // Redact all headers
        _header: '[REDACTED]',
        headers: '[REDACTED]',
      };
    }

    // Sanitize response
    if (error.response) {
      sanitizedError.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers, // Response headers from server are usually safe
        data: error.response.data,
        config: {
          ...error.response.config,
          headers: this.sanitizeHeaders(error.response.config?.headers),
        },
        // Explicitly redact the request inside response
        request: {
          method: error.response.request?.method,
          path: error.response.request?.path,
          host: error.response.request?.host,
          protocol: error.response.request?.protocol,
          _header: '[REDACTED]',
          headers: '[REDACTED]',
        },
      };
    }

    sanitizedError.status = error.response?.status;

    return sanitizedError as AxiosError;
  }

  
   // Redacts sensitive header values while preserving header names for debugging.

  private sanitizeHeaders(headers: any): any {
    if (!headers) return headers;

    const sensitiveHeaderPatterns = [
      'authorization',
      'x-api-key',
      'api-key',
      'apikey',
      'token',
      'x-auth-token',
      'x-access-token',
      'cookie',
      'set-cookie',
      'x-csrf-token',
      'x-xsrf-token',
      'proxy-authorization',
      'api_key',
      'access_token',
      'client_secret',
      'api-secret',
    ];

    const sanitized: any = {};

    Object.keys(headers).forEach((key) => {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveHeaderPatterns.some((pattern) => lowerKey.includes(pattern.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = headers[key];
      }
    });

    return sanitized;
  }

  private getAxiosRequestMethod(httpMethod: HttpMethod): string {
    return httpMethod.toString();
  }
}
