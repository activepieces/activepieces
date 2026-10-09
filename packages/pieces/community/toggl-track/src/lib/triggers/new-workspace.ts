import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglApi } from '../common/client';
import { togglModels } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof togglTrackAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    if (togglApi.isTwo(auth)) {
      throw togglApi.classicOnlyError(TRIGGER_NAME);
    }
    const workspaces = await togglApi.request<ClassicWorkspace[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: '/workspaces',
    });
    return (workspaces ?? []).map((workspace) => ({
      epochMilliSeconds: new Date(
        workspace.at ?? workspace.last_modified ?? 0
      ).getTime(),
      data: togglModels.classicWorkspace(workspace),
    }));
  },
};

export const newWorkspace = createTrigger({
  auth: togglTrackAuth,
  name: 'new_workspace',
  classification: 'READ',
  displayName: 'New or Updated Workspace',
  description:
    'Fires when a workspace is created or updated (Toggl only supports workspace updated events).',
  aiMetadata: {
    description:
      'Fires when a workspace is created or modified, delivering the workspace record (API token removed). Polls Toggl. Classic only.',
  },
  props: {},
  outputSchema: togglOutputSchemas.workspace,
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
    at: '2025-09-01T09:23:02+00:00',
    logo_url: 'https://assets.track.toggl.com/images/workspace.jpg',
    ical_enabled: true,
    working_hours_in_minutes: null,
    active_project_count: 1,
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    if (togglApi.isTwo(context.auth)) {
      throw togglApi.classicOnlyError(TRIGGER_NAME);
    }
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },

  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});

const TRIGGER_NAME = 'The New or Updated Workspace trigger';

type ClassicWorkspace = {
  id: number;
  name: string;
  at?: string;
  last_modified?: string;
  api_token?: string;
  ical_url?: string;
  [key: string]: unknown;
};
