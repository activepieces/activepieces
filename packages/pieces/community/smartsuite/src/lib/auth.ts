import { PieceAuth, Property, Validators } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';

/**
 * SmartSuite API Authentication
 * Uses Token-based authentication
 * Format: "Authorization: Token YOUR_TOKEN"
 * Docs: https://developers.smartsuite.com/docs/authentication
 */
export const smartsuiteAuth = PieceAuth.SecretText({
  description: 'API Token from SmartSuite (Profile → API Token)',
  required: true,
  displayName: 'API Token',
  validators: [Validators.pattern(/\w+/)],
});

/**
 * Workspace ID for SmartSuite
 * Required in ACCOUNT-ID header
 */
export const workspaceId = Property.ShortText({
  displayName: 'Workspace ID',
  description: 'Your SmartSuite Workspace ID (found in Account Settings)',
  required: true,
});

/**
 * SmartSuite API Base URL
 */
export const API_BASE_URL = 'https://app.smartsuite.com';

/**
 * Table ID Dropdown with dynamic loading
 */
export const tableId = Property.Dropdown<'text'>({
  displayName: 'Table',
  required: true,
  refreshers: ['auth', 'workspace_id'],
  options: async ({ auth, workspace_id }) => {
    if (!auth || !workspace_id) {
      return { disabled: true, options: [], placeholder: 'Enter API token and workspace ID' };
    }

    try {
      const response = await httpClient.sendRequest<{
        data: Array<{ id: string; name: string; title: string }>;
      }>({
        method: 'GET',
        url: `${API_BASE_URL}/api/v1/applications/`,
        headers: {
          'Authorization': `Token ${auth}`,
          'ACCOUNT-ID': workspace_id as string,
          'Content-Type': 'application/json',
        },
      });

      return {
        options: response.body.data.map((table) => ({
          label: table.name || table.title || table.id,
          value: table.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Error loading tables' };
    }
  },
});
