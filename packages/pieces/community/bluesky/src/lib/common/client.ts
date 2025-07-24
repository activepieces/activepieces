import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BlueSkyAuthType } from './auth';

export interface BlueSkySession {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
  didDoc?: any;
  email?: string;
  emailConfirmed?: boolean;
  emailAuthFactor?: boolean;
  active?: boolean;
  status?: string;
}

let cachedSession: BlueSkySession | null = null;
let sessionExpiry: number = 0;

// Constants for API endpoints
const BLUESKY_PUBLIC_API = 'https://public.api.bsky.app';
const BLUESKY_SOCIAL_ENTRYWAY = 'https://bsky.social';

export async function createSession(auth: BlueSkyAuthType): Promise<BlueSkySession> {
  // Check if we have a valid cached session
  if (cachedSession && Date.now() < sessionExpiry) {
    return cachedSession;
  }

  try {
    // Use the configured PDS host for session creation
    const pdsHost = auth.pdsHost || BLUESKY_SOCIAL_ENTRYWAY;
    
    const response = await httpClient.sendRequest<BlueSkySession>({
      method: HttpMethod.POST,
      url: `${pdsHost}/xrpc/com.atproto.server.createSession`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        identifier: auth.identifier,
        password: auth.password,
      },
    });

    if (response.status === 200 && response.body.accessJwt) {
      cachedSession = response.body;
      // Cache for 50 minutes (tokens typically last 1 hour)
      sessionExpiry = Date.now() + 50 * 60 * 1000;
      return response.body;
    } else {
      throw new Error('Failed to create session');
    }
  } catch (error: any) {
    // Clear cached session on error
    cachedSession = null;
    sessionExpiry = 0;
    
    if (error.response?.status === 401) {
      throw new Error('Invalid credentials');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid request format');
    } else {
      throw new Error(`Session creation failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export async function refreshSession(auth: BlueSkyAuthType, refreshJwt: string): Promise<BlueSkySession> {
  try {
    const pdsHost = auth.pdsHost || BLUESKY_SOCIAL_ENTRYWAY;
    
    const response = await httpClient.sendRequest<BlueSkySession>({
      method: HttpMethod.POST,
      url: `${pdsHost}/xrpc/com.atproto.server.refreshSession`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshJwt}`,
      },
    });

    if (response.status === 200 && response.body.accessJwt) {
      cachedSession = response.body;
      sessionExpiry = Date.now() + 50 * 60 * 1000;
      return response.body;
    } else {
      throw new Error('Failed to refresh session');
    }
  } catch (error: any) {
    // Clear cached session on error
    cachedSession = null;
    sessionExpiry = 0;
    throw new Error(`Session refresh failed: ${error.message || 'Unknown error'}`);
  }
}

// Determine the correct API host based on the endpoint and authentication status
function getApiHost(endpoint: string, isAuthenticated: boolean, pdsHost?: string): string {
  // For authenticated requests, use the user's PDS host (with fallback to entryway)
  if (isAuthenticated) {
    return pdsHost || BLUESKY_SOCIAL_ENTRYWAY;
  }
  
  // For public requests, prefer the public API endpoint for better caching
  // This applies to read-only operations that don't require authentication
  if (endpoint.startsWith('app.bsky.')) {
    return BLUESKY_PUBLIC_API;
  }
  
  // For AT Protocol endpoints, use the public API or entryway
  return BLUESKY_PUBLIC_API;
}

export async function makeBlueskyRequest(
  auth: BlueSkyAuthType,
  method: HttpMethod,
  endpoint: string,
  body?: any,
  queryParams?: Record<string, any>,
  requiresAuth: boolean = true
): Promise<any> {
  const session = requiresAuth ? await createSession(auth) : null;
  const apiHost = getApiHost(endpoint, requiresAuth, auth.pdsHost);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session) {
    headers['Authorization'] = `Bearer ${session.accessJwt}`;
  }
  
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${apiHost}/xrpc/${endpoint}`,
      headers,
      body,
      queryParams,
    });

    return response.body;
  } catch (error: any) {
    // If we get a 401 and have a session, try to refresh once
    if (error.response?.status === 401 && session?.refreshJwt && requiresAuth) {
      try {
        const refreshedSession = await refreshSession(auth, session.refreshJwt);
        
        const retryResponse = await httpClient.sendRequest({
          method,
          url: `${apiHost}/xrpc/${endpoint}`,
          headers: {
            ...headers,
            'Authorization': `Bearer ${refreshedSession.accessJwt}`,
          },
          body,
          queryParams,
        });

        return retryResponse.body;
      } catch (refreshError: any) {
        throw new Error(`Authentication failed: ${refreshError.message || 'Unknown error'}`);
      }
    }
    
    throw error;
  }
}

export async function getCurrentSession(auth: BlueSkyAuthType): Promise<BlueSkySession> {
  return createSession(auth);
}
