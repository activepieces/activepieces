import { PieceAuth, Property, Validators } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';

export const clockifyAuth = PieceAuth.SecretText({
  description: 'API Key from Clockify Profile Settings',
  required: true,
  displayName: 'API Key',
  validators: [Validators.pattern(/\w+/)],
});

export const workspaceId = Property.Dropdown({
  displayName: 'Workspace',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Enter API key' };

    try {
      const response = await httpClient.sendRequest<any[]>({
        method: 'GET',
        url: 'https://api.clockify.me/api/v1/workspaces',
        headers: { 'X-Api-Key': auth as string },
      });

      return {
        options: response.body.map((ws: any) => ({
          label: ws.name,
          value: ws.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Error loading workspaces' };
    }
  },
});

export const projectId = Property.Dropdown({
  displayName: 'Project (Optional)',
  required: false,
  refreshers: ['auth', 'workspace_id'],
  options: async ({ auth, workspace_id }) => {
    if (!auth || !workspace_id) return { disabled: true, options: [] };

    try {
      const response = await httpClient.sendRequest<any[]>({
        method: 'GET',
        url: `https://api.clockify.me/api/v1/workspaces/${workspace_id}/projects`,
        headers: { 'X-Api-Key': auth as string },
      });

      return {
        options: response.body.map((p: any) => ({
          label: p.name,
          value: p.id,
        })),
      };
    } catch {
      return { disabled: true, options: [] };
    }
  },
});
