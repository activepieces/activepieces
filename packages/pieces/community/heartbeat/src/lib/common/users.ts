import { HttpMethod } from '@activepieces/pieces-common';
import { heartbeatApi } from './client';

async function getUser({ token, userId }: { token: string; userId: string }): Promise<Record<string, unknown>> {
  return heartbeatApi.request<Record<string, unknown>>({
    token,
    method: HttpMethod.GET,
    path: `/users/${userId}`,
    operation: 'get member',
  });
}

async function findUserByEmail({ token, email }: { token: string; email: string }): Promise<Record<string, unknown> | null> {
  try {
    const result = await heartbeatApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: '/find/users',
      operation: 'find member by email',
      query: { email },
    });
    if (Array.isArray(result)) {
      return result.find(heartbeatApi.isRecord) ?? null;
    }
    return heartbeatApi.isRecord(result) ? result : null;
  } catch (error) {
    if (heartbeatApi.statusOf(error) === 404) {
      return null;
    }
    throw error;
  }
}

function withoutProfileDetails(user: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(user).filter(([key]) => !PROFILE_DETAIL_KEYS.includes(key)),
  );
}

async function createUser({ token, body }: { token: string; body: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const created = await heartbeatApi.request<unknown>({
    token,
    method: HttpMethod.PUT,
    path: '/users',
    operation: 'create member',
    body,
  });
  const vendor = heartbeatApi.isRecord(created) ? created : {};
  const userId = typeof vendor['userID'] === 'string' ? vendor['userID'] : undefined;
  const lookup = await heartbeatApi.afterWrite({
    what: 'the new member',
    load: () => (userId ? getUser({ token, userId }) : findUserByEmail({ token, email: String(body['email']) })),
  });
  const user = lookup.value;
  return { ...vendor, ...(user ?? {}), userID: userId ?? user?.['id'] ?? null, lookupError: lookup.lookupError };
}

const PROFILE_DETAIL_KEYS = ['linkedInData', 'linkedInSummary', 'onboardingResponses'];

export const heartbeatUsers = {
  getUser,
  findUserByEmail,
  withoutProfileDetails,
  createUser,
};
