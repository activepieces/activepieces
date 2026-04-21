import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://harvest.greenhouse.io/v3';
const TOKEN_URL = 'https://auth.greenhouse.io/token';

export async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await httpClient.sendRequest<{ access_token: string }>({
    method: HttpMethod.POST,
    url: TOKEN_URL,
    queryParams: { grant_type: 'client_credentials' },
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });
  return response.body.access_token;
}

export async function greenhouseApiCall<T extends HttpMessageBody>({
  auth,
  method,
  endpoint,
  body,
  queryParams,
  onBehalfOf,
}: {
  auth: { client_id: string; client_secret: string };
  method: HttpMethod;
  endpoint: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
  onBehalfOf?: string;
}) {
  const token = await getAccessToken(auth.client_id, auth.client_secret);
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(onBehalfOf ? { 'On-Behalf-Of': onBehalfOf } : {}),
    },
    body,
    queryParams,
  });
}

export type GreenhouseCandidate = {
  id: number;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  company: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  private: boolean;
  can_email: boolean;
  tags: string[];
  email_addresses: { value: string; type: string }[];
  phone_numbers: { value: string; type: string }[];
  website_addresses: { value: string; type: string }[];
  social_media_addresses: { value: string }[];
};

export function shapeCandidate(c: GreenhouseCandidate) {
  return {
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    preferred_name: c.preferred_name ?? null,
    company: c.company,
    title: c.title,
    created_at: c.created_at,
    updated_at: c.updated_at,
    last_activity_at: c.last_activity_at,
    private: c.private,
    can_email: c.can_email,
    primary_email: c.email_addresses?.[0]?.value ?? null,
    primary_email_type: c.email_addresses?.[0]?.type ?? null,
    primary_phone: c.phone_numbers?.[0]?.value ?? null,
    primary_phone_type: c.phone_numbers?.[0]?.type ?? null,
    website_url: c.website_addresses?.find((w) => w.type === 'personal')?.value ?? null,
    linkedin_url: c.social_media_addresses?.[0]?.value ?? null,
    tags: (c.tags ?? []).join(', '),
  };
}

