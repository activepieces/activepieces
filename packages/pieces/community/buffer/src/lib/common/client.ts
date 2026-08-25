import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BUFFER_API_URL = 'https://api.buffer.com';

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; path?: string[]; extensions?: unknown }>;
};

async function graphqlRequest<T>({
  accessToken,
  query,
  variables,
}: {
  accessToken: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<GraphQLResponse<T>>({
    method: HttpMethod.POST,
    url: BUFFER_API_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: { query, variables: variables ?? {} },
  });

  const body = response.body;
  if (body.errors && body.errors.length > 0) {
    throw new Error(
      `Buffer API error: ${body.errors.map((e) => e.message).join('; ')}`,
    );
  }
  if (!body.data) {
    throw new Error('Buffer API returned no data');
  }
  return body.data;
}

export const bufferClient = {
  graphql: graphqlRequest,
  apiUrl: BUFFER_API_URL,
};
