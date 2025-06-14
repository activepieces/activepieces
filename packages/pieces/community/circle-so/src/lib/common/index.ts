import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://app.circle.so/api/admin/v2';

export async function makeCircleRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

// Helper function to fetch spaces
export async function fetchSpaces(apiKey: string) {
  return await makeCircleRequest(apiKey, HttpMethod.GET, '/spaces');
}

// Helper function to fetch posts
export async function fetchPosts(apiKey: string, spaceId: string) {
  return await makeCircleRequest(apiKey, HttpMethod.GET, `/spaces/${spaceId}/posts`);
}

// Helper function to fetch community members
export async function fetchMembers(apiKey: string) {
  return await makeCircleRequest(apiKey, HttpMethod.GET, '/community_members');
}
