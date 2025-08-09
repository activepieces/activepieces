import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { GoogleChatSpace, GoogleChatSpacesResponse } from './types';

// Cache for spaces to avoid repeated API calls
const spacesCache = new Map<string, { data: Array<{ label: string; value: string }>; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

// Deduplication map to prevent multiple simultaneous requests
const pendingRequests = new Map<string, Promise<Array<{ label: string; value: string }>>>();

// Helper function to make a request with timeout and retry logic
async function makeRequestWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT,
  retries: number = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && (error instanceof Error && error.name === 'AbortError' || error instanceof TypeError)) {
      // Retry on timeout or network errors
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return makeRequestWithTimeout(url, options, timeout, retries - 1);
    }
    
    throw error;
  }
}

// Helper function to clean up old cache entries
function cleanupCache(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  for (const [key, value] of spacesCache.entries()) {
    if ((now - value.timestamp) > CACHE_DURATION) {
      entriesToDelete.push(key);
    }
  }
  
  entriesToDelete.forEach(key => spacesCache.delete(key));
  
  // If cache is still too large, remove oldest entries
  if (spacesCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(spacesCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, spacesCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => spacesCache.delete(key));
  }
}

export async function getSpacesOptions(auth: OAuth2PropertyValue) {
  // Clean up old cache entries periodically
  cleanupCache();
  
  const cacheKey = `spaces_${auth.access_token}`;
  const now = Date.now();
  
  // Check cache first
  const cached = spacesCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return {
      disabled: false,
      options: cached.data,
    };
  }

  // Check if there's already a pending request
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    try {
      const result = await pendingRequest;
      return {
        disabled: false,
        options: result,
      };
    } catch (error) {
      // If the pending request failed, we'll make a new one
      pendingRequests.delete(cacheKey);
    }
  }

  // Create new request
  const requestPromise = (async (): Promise<Array<{ label: string; value: string }>> => {
    try {
      const response = await makeRequestWithTimeout(
        'https://chat.googleapis.com/v1/spaces',
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Chat API error: ${response.status} ${errorText}`);
      }

      const data: GoogleChatSpacesResponse = await response.json();
      const spaces = data.spaces || [];
      const options = spaces.map((space: GoogleChatSpace) => ({
        label: space.displayName || space.name,
        value: space.name,
      }));

      // Cache the result
      spacesCache.set(cacheKey, {
        data: options,
        timestamp: now,
      });

      return options;
    } catch (error) {
      console.error('Error fetching Google Chat spaces:', error);
      throw error;
    }
  })();

  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const options = await requestPromise;
    return {
      disabled: false,
      options,
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: error instanceof Error ? error.message : 'Error loading spaces',
    };
  } finally {
    // Clean up the pending request
    pendingRequests.delete(cacheKey);
  }
}

export async function makeGoogleChatRequest(
  url: string,
  token: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await makeRequestWithTimeout(
    url,
    {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Chat API request failed: ${response.status} ${error}`);
  }

  return response.json();
} 