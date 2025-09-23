import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import {
  HttpMethod,
  httpClient,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

const polling: Polling<string, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const authHeader = `Basic ${Buffer.from(`${auth}:api_token`).toString('base64')}`;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.track.toggl.com/api/v9/workspaces',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const workspaces = response.body as any[];
    
    return workspaces.map((workspace: any) => ({
      epochMilliSeconds: new Date(workspace.at || workspace.last_modified).getTime(),
      data: workspace,
    }));
  },
};

export const newWorkspace = createTrigger({
  auth: togglTrackAuth,
  name: 'new_workspace',
  displayName: 'New or Updated Workspace',
  description: 'Fires when a workspace is created or updated (Toggl only supports workspace updated events).',
  props: {},
  sampleData: {
    id: 20763798,
    organization_id: 20764737,
    name: 'Workspace',
    premium: true,
    business_ws: true,
    admin: true,
    role: 'admin',
    suspended_at: null,
    server_deleted_at: null,
    default_hourly_rate: null,
    rate_last_updated: null,
    default_currency: 'USD',
    only_admins_may_create_projects: false,
    only_admins_may_create_tags: false,
    only_admins_see_team_dashboard: false,
    projects_billable_by_default: true,
    projects_private_by_default: true,
    projects_enforce_billable: false,
    limit_public_project_data: false,
    last_modified: '2025-09-01T00:00:00Z',
    reports_collapse: true,
    rounding: 1,
    rounding_minutes: 0,
    api_token: '72565784d2250b9ba2f2d61039ba9fee',
    at: '2025-09-01T09:23:02+00:00',
    logo_url: 'https://assets.track.toggl.com/images/workspace.jpg',
    ical_enabled: true,
    working_hours_in_minutes: null,
    active_project_count: 1,
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
