import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const meistertaskAuth = PieceAuth.SecretText({
  description: 'API Key from MeisterToken',
  required: true,
  displayName: 'API Key',
});

export const projectId = Property.Dropdown({
  displayName: 'Project',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Enter API key' };

    try {
      const response = await fetch('https://www.meistertask.com/api/projects', {
        headers: { 'Authorization': `Bearer ${auth}` },
      });
      const data = await response.json();
      return {
        options: data.map((p: any) => ({ label: p.name, value: p.id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Error loading projects' };
    }
  },
});
