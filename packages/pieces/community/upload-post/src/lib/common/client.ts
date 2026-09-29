import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import FormData from 'form-data';

async function request<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: FormData;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${UPLOAD_POST_API_URL}${path}`,
    headers: {
      Authorization: `Apikey ${apiKey}`,
    },
    queryParams,
    body,
  });
}

function compactQuery(
  params: Record<string, string | number | undefined | null>,
): QueryParams {
  return Object.fromEntries(
    Object.entries(params)
      .filter(
        (entry): entry is [string, string | number] =>
          entry[1] !== undefined && entry[1] !== null && entry[1] !== '',
      )
      .map(([key, value]) => [key, String(value)]),
  );
}

export const UPLOAD_POST_API_URL = 'https://api.upload-post.com/api';

export const uploadPostClient = {
  request,
  compactQuery,
};
