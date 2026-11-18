import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownState, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from './auth';
import { netlifyClient, NetlifyAuthValue } from './client';

type Choice = { label: string; value: string };

async function dropdown({ auth, load }: { auth: unknown; load: (auth: NetlifyAuthValue) => Promise<{ options: Choice[]; truncated: boolean }> }): Promise<DropdownState<string>> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Netlify account first' };
  }
  try {
    const { options, truncated } = await load(auth);
    return {
      disabled: false,
      options,
      placeholder: options.length === 0 ? 'Nothing found in this account' : truncated ? `Showing the first ${options.length}` : 'Select one',
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: `Could not load the list: ${error instanceof Error ? error.message : 'unknown error'}` };
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

async function loadSites(auth: NetlifyAuthValue): Promise<{ options: Choice[]; truncated: boolean }> {
  const { items, truncated } = await netlifyClient.listAll({ auth, path: '/sites', query: { filter: 'all' } });
  return {
    truncated,
    options: items
      .filter((site) => typeof site['id'] === 'string')
      .map((site) => ({ label: `${text(site['name']) || text(site['id'])} (${text(site['ssl_url']) || text(site['url'])})`, value: text(site['id']) })),
  };
}

function siteDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    auth: netlifyAuth,
    displayName: 'Site',
    description,
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => dropdown({ auth, load: loadSites }),
  });
}

function siteId() {
  return Property.ShortText({
    displayName: 'Site ID',
    description: 'The Netlify site ID (API ID, a UUID) or the site domain such as my-site.netlify.app. Use List Sites to find it.',
    required: true,
  });
}

function formDropdown() {
  return Property.Dropdown({
    auth: netlifyAuth,
    displayName: 'Form',
    description: 'The form whose submissions to list.',
    required: true,
    refreshers: ['auth', 'siteId'],
    options: async ({ auth, siteId }) => {
      if (!siteId) {
        return { disabled: true, options: [], placeholder: 'Select a site first' };
      }
      return dropdown({
        auth,
        load: async (connection) => {
          const response = await netlifyClient.request<Record<string, unknown>[]>({
            auth: connection,
            method: HttpMethod.GET,
            path: `/sites/${netlifyClient.segment({ value: siteId, label: 'Site' })}/forms`,
          });
          const forms = Array.isArray(response.body) ? response.body : [];
          return {
            truncated: false,
            options: forms
              .filter((form) => typeof form['id'] === 'string')
              .map((form) => ({ label: `${text(form['name']) || text(form['id'])} (${String(form['submission_count'] ?? 0)} submissions)`, value: text(form['id']) })),
          };
        },
      });
    },
  });
}

function deployId({ description }: { description?: string } = {}) {
  return Property.ShortText({
    displayName: 'Deploy ID',
    description: description ?? 'The Netlify deploy ID, e.g. 6512f0c1a2b3c40008d9e123 (from List Site Deploys or a deploy trigger).',
    required: true,
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Page number, starting at 1.',
    required: false,
    defaultValue: 1,
  });
}

function perPage({ defaultValue }: { defaultValue?: number } = {}) {
  return Property.Number({
    displayName: 'Per Page',
    description: 'Items per page, 1-100.',
    required: false,
    defaultValue,
  });
}

export const netlifyProps = { siteDropdown, siteId, formDropdown, deployId, page, perPage };
