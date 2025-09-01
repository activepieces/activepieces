import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { toggleTrackAuth } from '../../index';

export const newWorkspace = createTrigger({
  auth: toggleTrackAuth,
  name: 'newWorkspace',
  displayName: 'New Workspace',
  description: 'Fires when a new workspace is created.',
  props: {},
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await context.store?.put('_last_check', new Date().toISOString());
  },

  async onDisable(context) {
    await context.store?.delete('_last_check');
  },

  async run(context) {
    try {
      const lastCheckRaw = await context.store?.get('_last_check');
      const lastCheckDate =
        typeof lastCheckRaw === 'string' ? new Date(lastCheckRaw) : new Date(0);

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.track.toggl.com/api/v9/me/workspaces',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
      });

      if (response.status !== 200) return [];

      const workspaces = Array.isArray(response.body) ? response.body : [];
      const newWorkspaces = workspaces.filter((workspace: any) => {
        if (!workspace.at) return false;
        return new Date(workspace.at) > lastCheckDate;
      });

      await context.store?.put('_last_check', new Date().toISOString());

      return newWorkspaces.map((workspace: any) => ({
        id: workspace.id,
        name: workspace.name,
        organization_id: workspace.organization_id,
        created_at: workspace.at,
      }));
    } catch (error) {
      return [];
    }
  },

  sampleData: {
    id: 3134975,
    name: 'Marketing Team Workspace',
    organization_id: 5318008,
    created_at: '2025-09-01T10:30:00+00:00',
    premium: true,
    admin: true,
    default_hourly_rate: 50,
    default_currency: 'USD',
    only_admins_may_create_projects: false,
    only_admins_see_billable_rates: true,
    rounding: 1,
    rounding_minutes: 0,
  },
});
