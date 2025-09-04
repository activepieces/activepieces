import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { API_ENDPOINTS, BASE_URL } from './constants';

async function fireHttpRequest<T>({
  method,
  auth,
  path,
  body,
}: {
  auth: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}) {
  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ACCESS_TOKEN: auth,
      },
      body,
    })
    .then((res) => res.body);
}

export const wealthboxApiService = {
  fetchCurrentlyLoggedInUser: async (auth: string) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: API_ENDPOINTS.ME,
    });

    return response;
  },
  fetchTasks: async (auth: string) => {
    let path = API_ENDPOINTS.TASKS;

    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path,
    });

    return response;
  },
};
