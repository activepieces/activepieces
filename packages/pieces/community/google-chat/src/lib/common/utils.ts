import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { GoogleChatSpace, GoogleChatSpacesResponse } from './types';

export async function getSpacesOptions(auth: OAuth2PropertyValue) {
  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
    },
  });

  if (!response.ok) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Error loading spaces',
    };
  }

  const data: GoogleChatSpacesResponse = await response.json();
  const spaces = data.spaces || [];

  return {
    disabled: false,
    options: spaces.map((space: GoogleChatSpace) => ({
      label: space.displayName || space.name,
      value: space.name,
    })),
  };
}

export async function makeGoogleChatRequest(
  url: string,
  token: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Chat API request failed: ${error}`);
  }

  return response.json();
} 