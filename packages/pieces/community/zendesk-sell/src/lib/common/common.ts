import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.getbase.com/v2';

export interface ZendeskSellAuth {
  apiKey: string;
}

export async function makeZendeskSellRequest<T>(
  auth: string,
  method: HttpMethod,
  endpoint: string,
  body?: any
): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await httpClient.sendRequest(request);
  return response.body as T;
}

export interface Contact {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  title: string;
  description: string;
  organization_name: string;
  contact_id: number;
  owner_id: number;
  custom_fields: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  title: string;
  description: string;
  organization_name: string;
  status: string;
  source_id: number;
  owner_id: number;
  custom_fields: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  name: string;
  value: number;
  currency: string;
  hot: boolean;
  stage_id: number;
  contact_id: number;
  organization_id: number;
  owner_id: number;
  estimated_close_date: string;
  customized_win_likelihood: number;
  custom_fields: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_stage_change_at: string;
}

export interface Note {
  id: number;
  content: string;
  resource_type: 'lead' | 'contact' | 'deal';
  resource_id: number;
  creator_id: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  content: string;
  due_date: string;
  remind_at: string;
  resource_type: 'lead' | 'contact' | 'deal';
  resource_id: number;
  completed: boolean;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: {
    line1: string;
    city: string;
    postal_code: string;
    state: string;
    country: string;
  };
  owner_id: number;
  custom_fields: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
}
