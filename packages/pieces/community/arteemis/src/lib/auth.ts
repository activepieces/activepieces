import { PieceAuth } from '@activepieces/pieces-framework';
import { arteemisApi, isRecord } from './common/client';

type Workspaces = { active_workspace_id: string; workspaces: { id: string; name: string; active?: boolean }[] };

export const arteemisAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:

1. In Arteemis, open **Settings > MCP & API**.
2. Create a **workspace key** (it starts with \`art_key_\`) and copy it.

A workspace key never expires and can set up the triggers. A personal token (\`art_pat_\`) also works for the actions, with your own role; the triggers need a workspace key or the admin role.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      // workspaces_list is a free read any valid key may call.
      await arteemisApi.call({ apiKey: auth, tool: 'workspaces_list' });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Arteemis refused this API key. Create a workspace key in Settings > MCP & API and paste it again.',
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const { data } = await arteemisApi.call<Workspaces>({ apiKey: auth, tool: 'workspaces_list' });
      const workspace = data.workspaces.find((item) => isRecord(item) && item.active) ?? data.workspaces[0];
      return workspace?.name ?? data.active_workspace_id;
    } catch {
      return undefined;
    }
  },
});
