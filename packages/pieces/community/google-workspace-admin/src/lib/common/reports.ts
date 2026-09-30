import { HttpMethod } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { GoogleWorkspaceAdminAuthValue } from '../auth';
import { googleAdminClient, REPORTS_URL } from './client';

function createActivityPoller<PropsValue>({
  getQuery,
  mapEvents = async ({ events }) => events,
}: {
  getQuery: (propsValue: PropsValue) => ActivityQuery;
  mapEvents?: (params: { auth: GoogleWorkspaceAdminAuthValue; events: ActivityEvent[] }) => Promise<unknown[]>;
}) {
  return {
    async onEnable({ store, isRepublish }: PollerContext<PropsValue>) {
      if (isRepublish && (await store.get<number>(LAST_POLL_KEY)) !== null) {
        return;
      }
      const now = Date.now();
      await store.put(ENABLED_AT_KEY, now);
      await store.put(LAST_POLL_KEY, now);
      await store.put(SEEN_KEYS_KEY, []);
    },
    async test({ auth, propsValue }: PollerContext<PropsValue>) {
      const events = await fetchEvents({ auth, query: getQuery(propsValue), startTime: undefined });
      return mapEvents({ auth, events });
    },
    async poll({ auth, propsValue, store }: PollerContext<PropsValue>) {
      const now = Date.now();
      const lastPoll = (await store.get<number>(LAST_POLL_KEY)) ?? now;
      const enabledAt = (await store.get<number>(ENABLED_AT_KEY)) ?? lastPoll;
      const seen = new Set((await store.get<string[]>(SEEN_KEYS_KEY)) ?? []);
      const events = await fetchEvents({
        auth,
        query: getQuery(propsValue),
        startTime: Math.max(enabledAt, Math.min(lastPoll, now - LOOKBACK_MS)),
      });
      const fresh = events.filter((event) => !seen.has(eventKey(event)));
      const data = await mapEvents({ auth, events: fresh });
      await store.put(SEEN_KEYS_KEY, events.slice(0, MAX_SEEN_KEYS).map(eventKey));
      await store.put(LAST_POLL_KEY, now);
      return data.reverse();
    },
  };
}

async function fetchEvents({
  auth,
  query,
  startTime,
}: {
  auth: GoogleWorkspaceAdminAuthValue;
  query: ActivityQuery;
  startTime: number | undefined;
}): Promise<ActivityEvent[]> {
  const url = `${REPORTS_URL}/activity/users/all/applications/${query.application}`;
  const activities =
    startTime === undefined
      ? (
          await googleAdminClient.request<{ items?: Activity[] }>({
            auth,
            method: HttpMethod.GET,
            url,
            queryParams: { eventName: query.eventName, maxResults: TEST_PAGE_SIZE },
          })
        ).items ?? []
      : await googleAdminClient.listAll<{ nextPageToken?: string; items?: Activity[] }, Activity>({
          auth,
          url,
          getItems: (r) => r.items,
          queryParams: { eventName: query.eventName, startTime: new Date(startTime).toISOString() },
        });
  return activities.flatMap(toEvents).filter((event) => (query.filter ? query.filter(event) : true));
}

function eventKey(event: ActivityEvent): string {
  return `${Date.parse(event.time).toString(36)}.${event.unique_qualifier}.${event.event_index}`;
}

function toEvents(activity: Activity): ActivityEvent[] {
  return (activity.events ?? []).map((event, eventIndex) => {
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
      event_index: eventIndex,
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
const LOOKBACK_MS = 60 * 60 * 1000;
const MAX_SEEN_KEYS = 4000;
const LAST_POLL_KEY = 'lastPoll';
const ENABLED_AT_KEY = 'enabledAt';
const SEEN_KEYS_KEY = 'seenEventKeys';

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
  event_index: 0,
  actor_email: 'admin@yourcompany.com',
  actor_profile_id: '101234567890123456789',
  ip_address: '203.0.113.10',
  event_type: 'USER_SETTINGS',
  event_name: 'CREATE_USER',
  user_email: 'jane.doe@yourcompany.com',
  group_email: null,
  parameters: { USER_EMAIL: 'jane.doe@yourcompany.com' },
};

export const reportsHelpers = { createActivityPoller };

export type ActivityEvent = {
  time: string;
  application: string;
  unique_qualifier: string;
  event_index: number;
  actor_email: string | null;
  actor_profile_id: string | null;
  ip_address: string | null;
  event_type: string | null;
  event_name: string;
  user_email: string | null;
  group_email: string | null;
  parameters: Record<string, unknown>;
};

type PollerContext<PropsValue> = {
  auth: GoogleWorkspaceAdminAuthValue;
  propsValue: PropsValue;
  store: Store;
  isRepublish?: boolean;
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
