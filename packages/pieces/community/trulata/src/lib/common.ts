import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const TRULATA_API = 'https://api.trulata.com/v1';

export async function trulataRequest<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
  query?: Record<string, string>
): Promise<T> {
  const res = await httpClient.sendRequest<T>({
    method,
    url: `${TRULATA_API}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
    body,
    queryParams: query,
  });
  return res.body;
}

export const LEAD_STATUSES = [
  { label: 'Contacted', value: 'contacted' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Not a lead', value: 'not_lead' },
];

export const sampleLead = {
  id: 'ld_3f9a1c27b84e5d6a0c12',
  created_at: '2026-10-21T09:14:00-04:00',
  name: 'Ana Ruiz',
  email: 'ana.ruiz@example.com',
  phone: '(303) 555-0142',
  service: 'Roof repair',
  message: 'Leak over the garage after the storm. Free Thursday.',
  town: 'Denver',
  page: '/roof-repair',
  source: 'Website form',
  quality: 'qualified',
  status: '',
  status_note: '',
};

export const samplePost = {
  id: 'po_118',
  title: 'How to tell if your roof needs repair or replacement',
  target_search: 'roof repair or replace',
  excerpt: 'Five signs that decide it, and what each one costs.',
  url: 'https://example.com/blog/roof-repair-or-replace',
  image_url: 'https://example.com/blog/roof.jpg',
  published_at: '2026-10-21T14:02:11+00:00',
  created_at: '2026-10-19T10:00:00+00:00',
};
