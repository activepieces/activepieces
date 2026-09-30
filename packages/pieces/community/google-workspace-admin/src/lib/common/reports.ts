import { DedupeStrategy, HttpMethod, Polling } from '@activepieces/pieces-common';
import { GoogleWorkspaceAdminAuthValue } from '../auth';
import { googleAdminClient, REPORTS_URL } from './client';

function createActivityPolling<PropsValue>({
  getQuery,
  mapEvents = async ({ events }) => events,
}: {
  getQuery: (propsValue: PropsValue) => ActivityQuery;
  mapEvents?: (params: { auth: GoogleWorkspaceAdminAuthValue; events: ActivityEvent[] }) => Promise<unknown[]>;
}): Polling<GoogleWorkspaceAdminAuthValue, PropsValue> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      const query = getQuery(propsValue);
      const activities = await fetchActivities({ auth, query, lastFetchEpochMS });
      const events = activities
        .flatMap(toEvents)
        .filter((event) => (query.filter ? query.filter(event) : true));
      const data = await mapEvents({ auth, events });
      return events.map((event, index) => ({
        epochMilliSeconds: Date.parse(event.time),
        data: data[index],
      }));
    },
  };
}

async function fetchActivities({
  auth,
  query,
  lastFetchEpochMS,
}: {
  auth: GoogleWorkspaceAdminAuthValue;
  query: ActivityQuery;
  lastFetchEpochMS: number;
}): Promise<Activity[]> {
  const url = `${REPORTS_URL}/activity/users/all/applications/${query.application}`;
  if (lastFetchEpochMS === 0) {
    const response = await googleAdminClient.request<{ items?: Activity[] }>({
      auth,
      method: HttpMethod.GET,
      url,
      queryParams: { eventName: query.eventName, maxResults: TEST_PAGE_SIZE },
    });
    return response.items ?? [];
  }
  return googleAdminClient.listAll<{ nextPageToken?: string; items?: Activity[] }, Activity>({
    auth,
    url,
    getItems: (r) => r.items,
    queryParams: { eventName: query.eventName, startTime: new Date(lastFetchEpochMS).toISOString() },
  });
}

function toEvents(activity: Activity): ActivityEvent[] {
  return (activity.events ?? []).map((event) => {
    const parameters = Object.fromEntries(
      (event.parameters ?? []).map((p) => [
        p.name,
        p.value ?? p.intValue ?? p.boolValue ?? p.multiValue ?? p.multiIntValue ?? null,
      ]),
    );
    return {
      time: activity.id.time,
      application: activity.id.applicationName,
      unique_qualifier: activity.id.uniqueQualifier,
      actor_email: activity.actor?.email ?? null,
      actor_profile_id: activity.actor?.profileId ?? null,
      ip_address: activity.ipAddress ?? null,
      event_type: event.type ?? null,
      event_name: event.name,
      user_email: stringParam(parameters['USER_EMAIL']),
      group_email: stringParam(parameters['GROUP_EMAIL']),
      parameters,
    };
  });
}

function stringParam(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

const TEST_PAGE_SIZE = 100;

export const REPORT_APPLICATIONS = [
  { label: 'Admin console', value: 'admin' },
  { label: 'Login', value: 'login' },
  { label: 'Drive', value: 'drive' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Gmail', value: 'gmail' },
  { label: 'Groups', value: 'groups' },
  { label: 'Groups (Enterprise)', value: 'groups_enterprise' },
  { label: 'Meet', value: 'meet' },
  { label: 'Chat', value: 'chat' },
  { label: 'OAuth Token', value: 'token' },
  { label: 'SAML', value: 'saml' },
  { label: 'User Accounts', value: 'user_accounts' },
  { label: 'Mobile Devices', value: 'mobile' },
  { label: 'Rules', value: 'rules' },
  { label: 'Chrome', value: 'chrome' },
  { label: 'Context-Aware Access', value: 'context_aware_access' },
  { label: 'Access Transparency', value: 'access_transparency' },
  { label: 'Google Cloud', value: 'gcp' },
  { label: 'Keep', value: 'keep' },
  { label: 'Vault', value: 'vault' },
  { label: 'Looker Studio', value: 'data_studio' },
];

export const ACTIVITY_EVENT_SAMPLE = {
  time: '2026-09-30T10:15:00.000Z',
  application: 'admin',
  unique_qualifier: '-1234567890123456789',
  actor_email: 'admin@yourcompany.com',
  actor_profile_id: '101234567890123456789',
  ip_address: '203.0.113.10',
  event_type: 'USER_SETTINGS',
  event_name: 'CREATE_USER',
  user_email: 'jane.doe@yourcompany.com',
  group_email: null,
  parameters: { USER_EMAIL: 'jane.doe@yourcompany.com' },
};

export const reportsHelpers = { createActivityPolling };

export type ActivityEvent = {
  time: string;
  application: string;
  unique_qualifier: string;
  actor_email: string | null;
  actor_profile_id: string | null;
  ip_address: string | null;
  event_type: string | null;
  event_name: string;
  user_email: string | null;
  group_email: string | null;
  parameters: Record<string, unknown>;
};

type ActivityQuery = {
  application: string;
  eventName?: string;
  filter?: (event: ActivityEvent) => boolean;
};

type Activity = {
  id: { time: string; uniqueQualifier: string; applicationName: string; customerId?: string };
  actor?: { email?: string; profileId?: string };
  ipAddress?: string;
  events?: {
    type?: string;
    name: string;
    parameters?: {
      name: string;
      value?: string;
      intValue?: string;
      boolValue?: boolean;
      multiValue?: string[];
      multiIntValue?: string[];
    }[];
  }[];
};
