import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export interface MissiveContact {
  id: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phonetic_first_name?: string;
  phonetic_last_name?: string;
  phonetic_middle_name?: string;
  prefix?: string;
  suffix?: string;
  nickname?: string;
  file_as?: string;
  notes?: string;
  starred?: boolean;
  gender?: string;
  contact_book: string;
  deleted: boolean;
  modified_at: number;
  infos?: Array<{
    kind: 'email' | 'phone_number' | 'twitter' | 'facebook' | 'physical_address' | 'url' | 'custom';
    label: string;
    value?: string;
    custom_label?: string;
    name?: string;
    street?: string;
    extended_address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    po_box?: string;
    country?: string;
  }>;
  memberships?: Array<{
    department?: string;
    title?: string;
    location?: string;
    description?: string;
    group: {
      id?: string;
      kind: 'organization' | 'group';
      name: string;
    };
  }>;
}

export interface MissiveContactBook {
  id: string;
  user: string;
  share_with_organization: boolean;
  share_with_team: string | null;
  share_with_users: string[];
  organization: string | null;
  name: string;
  description: string | null;
}

export interface MissiveContactGroup {
  id: string;
  name: string;
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
  account: string;
  subject?: string;
  body: string;
  from_field: {
    id?: string;
    username?: string;
    name?: string;
    address?: string;
  };
  to_fields: Array<{
    id?: string;
    username?: string;
    name?: string;
    address?: string;
  }>;
  cc_fields?: Array<{
    address: string;
    name?: string;
  }>;
  bcc_fields?: Array<{
    address: string;
    name?: string;
  }>;
  delivered_at?: number;
  external_id?: string;
  references?: string[];
  conversation?: string;
  team?: string;
  force_team?: boolean;
  organization?: string;
  add_users?: string[];
  add_assignees?: string[];
  conversation_subject?: string;
  conversation_color?: string;
  add_shared_labels?: string[];
  remove_shared_labels?: string[];
  add_to_inbox?: boolean;
  add_to_team_inbox?: boolean;
  close?: boolean;
  attachments?: Array<{
    base64_data: string;
    filename: string;
  }>;
}

export interface MissiveComment {
  id: string;
  body: string;
  conversation_id: string;
  created_at: number;
  mentions?: Array<{
    id: string;
    index: number;
    length: number;
  }>;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
  };
  attachment?: {
    id: string;
    filename: string;
    extension: string;
    url: string;
    media_type: string;
    sub_type: string;
    size: number;
  };
  task?: {
    description: string;
    state: 'todo' | 'in_progress' | 'closed';
    due_at: number;
    started_at: number;
    closed_at: number | null;
    assignees: Array<{
      id: string;
      name: string;
      email: string;
      avatar_url: string;
    }>;
    team?: {
      id: string;
      name: string;
      organization: string;
    };
  };
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