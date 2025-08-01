import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export interface MissiveContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  contact_book_id: string;
}

export interface MissiveContactBook {
  id: string;
  name: string;
  description?: string;
}

export interface MissiveContactGroup {
  id: string;
  name: string;
  contact_book_id: string;
}

export interface MissiveDraft {
  id: string;
  subject?: string;
  body?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  conversation_id?: string;
  send?: boolean;
}

export interface MissiveTask {
  id: string;
  title: string;
  description?: string;
  conversation_id?: string;
  assignee_id?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface MissiveMessage {
  id: string;
  subject?: string;
  body: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  conversation_id: string;
  created_at: string;
  updated_at: string;
}

export interface MissiveComment {
  id: string;
  body: string;
  conversation_id: string;
  created_at: string;
  updated_at: string;
}

export const missiveApiCall = async (
  apiToken: string,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: Record<string, unknown>
) => {
  const response = await httpClient.sendRequest({
    method,
    url: `https://public.missiveapp.com/v1${endpoint}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
};

export const getContactBooks = async (apiToken: string): Promise<MissiveContactBook[]> => {
  const response = await missiveApiCall(apiToken, '/contact_books');
  return response.contact_books || [];
};

export const getContactGroups = async (apiToken: string, contactBookId?: string): Promise<MissiveContactGroup[]> => {
  const endpoint = contactBookId ? `/contact_books/${contactBookId}/groups` : '/contact_groups';
  const response = await missiveApiCall(apiToken, endpoint);
  return response.contact_groups || [];
};

export const getContacts = async (apiToken: string, contactBookId?: string): Promise<MissiveContact[]> => {
  const endpoint = contactBookId ? `/contact_books/${contactBookId}/contacts` : '/contacts';
  const response = await missiveApiCall(apiToken, endpoint);
  return response.contacts || [];
}; 