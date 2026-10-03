import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { famulorAuth } from '../auth';
import { famulorApi } from './client';
import type { ApiField, ApiOperation } from './types';

function resourceFor({ field, operation }: { field: ApiField; operation: ApiOperation }): Resource | undefined {
  if (field.name === 'id' && field.in === 'path') return resources.find((resource) => operation.path.startsWith(`${resource.path}/{id}`));
  return resources.find((resource) => resource.fields.includes(field.name));
}

function resourceLabel(record: Record<string, unknown>): string {
  return String(record['name'] ?? record['number'] ?? record['phone'] ?? record['invitee_name'] ?? record['display_name'] ?? record['email'] ?? record['id']);
}

async function resourceOptions({ token, resource, searchValue }: { token: string; resource: Resource; searchValue?: string }) {
  const matches: { label: string; value: string }[] = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const response = await famulorApi.request({ token, method: HttpMethod.GET, path: resource.path, query: resource.unpaged ? undefined : { limit: '100', offset: String(offset) } });
    if (!famulorApi.isRecord(response)) throw new Error('Famulor returned an invalid resource list.');
    const data = response['data'];
    const rows = famulorApi.isRecord(data) && resource.key ? data[resource.key] : data;
    if (!Array.isArray(rows)) throw new Error('Famulor returned an invalid resource list.');
    for (const row of rows) {
      if (!famulorApi.isRecord(row) || typeof row['id'] !== 'string') continue;
      const label = `${resourceLabel(row)} (${row['id']})`;
      if (!searchValue || label.toLowerCase().includes(searchValue.toLowerCase())) matches.push({ label, value: row['id'] });
    }
    if (resource.unpaged || rows.length < 100 || matches.length >= 100) return { options: matches.slice(0, 100) };
  }
  return { options: matches.slice(0, 100), placeholder: 'Use a more specific search or map a resource UUID from a previous step.' };
}

function resourceProperty({ field, operation }: { field: ApiField; operation: ApiOperation }) {
  const resource = resourceFor({ field, operation });
  if (!resource) return undefined;
  return Property.Dropdown({
    auth: famulorAuth, displayName: resource.label, required: field.required, refreshers: [],
    description: `${field.description ?? ''} Select an item from this workspace, or map its UUID from a previous step.`,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Connect your Famulor workspace first.' };
      return resourceOptions({ token: auth.secret_text, resource, searchValue });
    },
  });
}

export const famulorResources = { resourceProperty, resourceOptions };
export const resources: Resource[] = [
  { path: '/assistants', label: 'Assistant', fields: ['assistant_id', 'fallback_assistant_id'] },
  { path: '/campaigns', label: 'Campaign', fields: ['campaign_id'] },
  { path: '/calls', label: 'Call', fields: ['call_id'] },
  { path: '/leads', label: 'Contact', fields: ['lead_id', 'contact_id'] },
  { path: '/phone-numbers', label: 'Phone Number', fields: ['phone_number_id'] },
  { path: '/knowledge-bases', label: 'Knowledge Base', fields: ['knowledge_base_id'] },
  { path: '/booking-event-types', label: 'Booking Event Type', fields: ['event_type_id'], unpaged: true },
  { path: '/bookings', label: 'Booking', fields: ['booking_id'] },
  { path: '/tools', label: 'Tool', fields: ['tool_id'], unpaged: true },
  { path: '/automations', label: 'Automation', fields: ['automation_id'], unpaged: true, key: 'automations' },
  { path: '/segments', label: 'Segment', fields: ['segment_id'] },
  { path: '/scheduled-callbacks', label: 'Scheduled Callback', fields: ['callback_id'] },
  { path: '/routines', label: 'Mission', fields: ['routine_id'], unpaged: true },
];

type Resource = { path: string; label: string; fields: string[]; unpaged?: boolean; key?: string };
