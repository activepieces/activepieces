import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { claritiaAuth } from './auth';
import { claritiaCall } from './common';

export const formDropdown = Property.Dropdown({
  auth: claritiaAuth,
  displayName: 'Form',
  description: 'Leave empty for every form.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Connect Claritia first' };
    const r = await claritiaCall<{ forms: { id: string; name: string }[] }>(auth, HttpMethod.GET, '/forms');
    return { disabled: false, options: r.forms.map((f) => ({ label: f.name, value: f.id })) };
  },
});

export const workflowDropdown = Property.Dropdown({
  auth: claritiaAuth,
  displayName: 'Workflow',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Connect Claritia first' };
    const r = await claritiaCall<{ workflows: { id: string; name: string }[] }>(auth, HttpMethod.GET, '/workflows');
    return { disabled: false, options: r.workflows.map((w) => ({ label: w.name, value: w.id })) };
  },
});
