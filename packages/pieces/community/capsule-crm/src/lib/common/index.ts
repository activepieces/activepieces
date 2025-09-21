import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.capsulecrm.com/api/v2';

export const capsuleCrmAuth = PieceAuth.CustomAuth({
  description: 'Get your personal access token from My Preferences > API Authentication Tokens in your Capsule account',
  required: true,
  props: {
    token: Property.ShortText({
      displayName: 'Personal Access Token',
      description: 'Your Capsule CRM personal access token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const request: HttpRequest = {
        method: 'GET',
        url: `${BASE_URL}/users`,
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await httpClient.sendRequest(request);

      if (response.status === 200 && response.body.users && response.body.users.length > 0) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: 'Invalid token or insufficient permissions',
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate token. Please check your token and try again.',
      };
    }
  },
});

export type CapsuleCrmAuthType = {
  token: string;
};

export const createAuthHeaders = (auth: CapsuleCrmAuthType) => ({
  Authorization: `Bearer ${auth.token}`,
  'Content-Type': 'application/json',
});

export const makeApiCall = async (
  auth: CapsuleCrmAuthType,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) => {
  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: createAuthHeaders(auth),
    body: body ? JSON.stringify(body) : undefined,
  };

  return await httpClient.sendRequest(request);
};

export const API_ENDPOINTS = {
  USERS: '/users',
  PARTIES: '/parties',
  OPPORTUNITIES: '/opportunities',
  TASKS: '/tasks',
  PROJECTS: '/kases', // Note: Capsule uses 'kases' for projects in API
  SEARCH_PARTIES: '/parties/search',
  SEARCH_OPPORTUNITIES: '/opportunities/search',
  SEARCH_PROJECTS: '/kases/search',
};

export interface CapsuleParty {
  id: number;
  type: 'person' | 'organisation';
  about?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  organisation?: {
    id: number;
    name: string;
  };
  name?: string;
  pictureURL?: string;
  addresses?: any[];
  phoneNumbers?: any[];
  websites?: any[];
  emailAddresses?: any[];
  tags?: any[];
  fields?: any[];
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CapsuleOpportunity {
  id: number;
  name: string;
  description?: string;
  party: {
    id: number;
    name: string;
  };
  milestone?: {
    id: number;
    name: string;
  };
  value?: {
    amount: number;
    currency: string;
  };
  expectedCloseOn?: string;
  probability?: number;
  duration?: number;
  owner?: {
    id: number;
    name: string;
  };
  team?: {
    id: number;
    name: string;
  };
  tags?: any[];
  fields?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CapsuleProject {
  id: number;
  name: string;
  description?: string;
  status: 'OPEN' | 'CLOSED';
  party: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    name: string;
  };
  team?: {
    id: number;
    name: string;
  };
  tags?: any[];
  fields?: any[];
  createdAt: string;
  updatedAt: string;
  expectedCloseOn?: string;
}

export interface CapsuleTask {
  id: number;
  description: string;
  status: 'OPEN' | 'COMPLETED' | 'FUTURE';
  category?: {
    id: number;
    name: string;
  };
  party?: {
    id: number;
    name: string;
  };
  opportunity?: {
    id: number;
    name: string;
  };
  kase?: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    name: string;
  };
  dueOn?: string;
  dueTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}