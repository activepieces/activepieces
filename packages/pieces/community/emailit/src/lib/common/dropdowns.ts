import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { EmailitAuthInput, emailitClient } from './client';

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

async function listAll({ auth, path }: { auth: EmailitAuthInput; path: string }): Promise<{ items: Record<string, unknown>[]; truncated: boolean }> {
  const items: Record<string, unknown>[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await emailitClient.request({ auth, method: HttpMethod.GET, path, query: { limit: PAGE_SIZE, page } });
    const result = emailitClient.listPage(body);
    items.push(...result.items.filter(emailitClient.isRecord));
    if (!result.hasMore || result.items.length === 0) {
      return { items, truncated: false };
    }
  }
  return { items, truncated: true };
}

async function options({ auth, path, label }: { auth: EmailitAuthInput | undefined; path: string; label: (item: Record<string, unknown>) => string }): Promise<DropdownState> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Emailit account first' };
  }
  try {
    const { items, truncated } = await listAll({ auth, path });
    const choices = items
      .filter((item) => typeof item['id'] === 'string')
      .map((item) => ({ label: label(item), value: String(item['id']) }));
    return {
      disabled: false,
      options: choices,
      placeholder: choices.length === 0 ? 'Nothing found in this workspace' : truncated ? `Showing the first ${choices.length}` : 'Select one',
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: `Could not load the list: ${error instanceof Error ? error.message : 'unknown error'}` };
  }
}

function audienceLabel(item: Record<string, unknown>): string {
  const name = typeof item['name'] === 'string' && item['name'].trim() !== '' ? item['name'] : '(unnamed audience)';
  const count = typeof item['subscribers_count'] === 'number' ? ` (${item['subscribers_count']} subscribers)` : '';
  return `${name}${count}`;
}

function domainLabel(item: Record<string, unknown>): string {
  const name = typeof item['name'] === 'string' ? item['name'] : String(item['id']);
  const status = typeof item['verification_status'] === 'string' ? ` (${item['verification_status']})` : '';
  return `${name}${status}`;
}

function audience() {
  return Property.Dropdown({
    auth: emailitAuth,
    displayName: 'Audience',
    description: 'The audience (subscriber list).',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => options({ auth, path: '/audiences', label: audienceLabel }),
  });
}

function audiences() {
  return Property.MultiSelectDropdown({
    auth: emailitAuth,
    displayName: 'Add to Audiences',
    description: 'Audiences to subscribe the contact to. Existing memberships are kept.',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => options({ auth, path: '/audiences', label: audienceLabel }),
  });
}

function domain() {
  return Property.Dropdown({
    auth: emailitAuth,
    displayName: 'Domain',
    description: 'The sending domain.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => options({ auth, path: '/domains', label: domainLabel }),
  });
}

export const emailitDropdowns = { audience, audiences, domain, listAll };

type DropdownState = { disabled: boolean; options: { label: string; value: string }[]; placeholder: string };
