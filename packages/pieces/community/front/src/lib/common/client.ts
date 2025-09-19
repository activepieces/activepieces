import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

const aPI_BASE_URL = 'https://api2.frontapp.com';

interface PaginatedResponse<T> {
  _results: T[];
  _pagination: {
    next?: string;
  };
}

export const makeRequest = async <T extends object>(
  token: string,
  method: HttpMethod,
  url: string,
  body?: object
): Promise<T> => {
  const isPaginatedMethod = [HttpMethod.GET].includes(method);

  if (!isPaginatedMethod) {
    const request: HttpRequest = {
      method: method,
      url: `${aPI_BASE_URL}${url}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
      body: body,
    };
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  }

  if (
    url.includes('/conversations') ||
    url.includes('/tags') ||
    url.includes('/inboxes')
  ) {
    const allResults: (T extends { _results: infer U } ? U : never)[] = [];
    let nextUrl: string | null = `${aPI_BASE_URL}${url}`;

    while (nextUrl) {
      const request: HttpRequest = {
        method: method,
        url: nextUrl,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: token,
        },
        body: body,
      };

      const response = await httpClient.sendRequest<PaginatedResponse<T>>(
        request
      );

      if (response.body?._results) {
        allResults.push(
          ...(response.body._results as (T extends { _results: infer U }
            ? U
            : never)[])
        );
      }

      if (response.body?._pagination?.next) {
        nextUrl = response.body._pagination.next;
      } else {
        nextUrl = null;
      }
    }
    return { _results: allResults } as T;
  }

  const request: HttpRequest = {
    method: method,
    url: `${aPI_BASE_URL}${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token,
    },
    body: body,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
};

export const makeRequestFirstPage = async <T extends object>(
  token: string,
  method: HttpMethod,
  url: string
): Promise<T> => {
  const request: HttpRequest = {
    method: method,
    url: `${aPI_BASE_URL}${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token,
    },
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
};