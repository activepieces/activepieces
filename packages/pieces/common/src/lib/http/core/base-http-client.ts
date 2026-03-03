import { Authentication } from '../../authentication';
import { DelegatingAuthenticationConverter } from './delegating-authentication-converter';
import type { HttpClient } from './http-client';
import { HttpHeader } from './http-header';
import type { HttpHeaders } from './http-headers';
import type { HttpMessageBody } from './http-message-body';
import type { HttpRequest } from './http-request';
import { HttpRequestBody } from './http-request-body';
import { HttpResponse } from './http-response';
import { MediaType } from './media-type';

export abstract class BaseHttpClient implements HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly authenticationConverter: DelegatingAuthenticationConverter
  ) {}

  abstract sendRequest<
    RequestBody extends HttpMessageBody,
    ResponseBody extends HttpMessageBody
  >(request: HttpRequest<RequestBody>): Promise<HttpResponse<ResponseBody>>;

  protected getUrl<RequestBody extends HttpMessageBody>(
    request: HttpRequest<RequestBody>
  ): {
    urlWithoutQueryParams: string;
    queryParams: URLSearchParams;
  } {
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

  protected getHeaders<RequestBody extends HttpRequestBody>(
    request: HttpRequest<RequestBody>
  ): HttpHeaders {
    let requestHeaders: HttpHeaders = {
      [HttpHeader.ACCEPT]: MediaType.APPLICATION_JSON,
    };

    if (request.authentication) {
      this.populateAuthentication(request.authentication, requestHeaders);
    }

    if (request.body) {
      switch (request.headers?.['Content-Type']) {
        case 'text/csv':
          requestHeaders[HttpHeader.CONTENT_TYPE] = MediaType.TEXT_CSV;
          break;

        default:
          requestHeaders[HttpHeader.CONTENT_TYPE] = MediaType.APPLICATION_JSON;
          break;
      }
    }
    if (request.headers) {
      requestHeaders = { ...requestHeaders, ...request.headers };
    }
    return requestHeaders;
  }

  private populateAuthentication(
    authentication: Authentication,
    headers: HttpHeaders
  ): void {
    this.authenticationConverter.convert(authentication, headers);
  }
}
