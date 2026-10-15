import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { weincRequest, WeincClient, WeincProject } from './client';

export const projectIdDropdown = Property.Dropdown({
  displayName: 'Project',
  description: 'Pick one of your organization projects.',
  auth: weincAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your WeInc account first' };
    }
    const res = await weincRequest<{ projects: WeincProject[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/projects',
      queryParams: { limit: '100' },
    });
    return {
      disabled: false,
      options: res.projects.map((p) => ({ label: p.name, value: p.id })),
    };
  },
});

export const clientEmailDropdown = Property.Dropdown({
  displayName: 'Client',
  description: 'The client account the project belongs to. The client must have activated their account.',
  auth: weincAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your WeInc account first' };
    }
    const res = await weincRequest<{ clients: WeincClient[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/clients',
    });
    return {
      disabled: false,
      options: res.clients.map((c) => ({
        label: c.name ? `${c.name} (${c.email})` : c.email,
        value: c.email,
      })),
    };
  },
});

export const projectStatusOptions = {
  disabled: false,
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
  ],
};
