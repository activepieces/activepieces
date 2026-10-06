import { randomUUID } from 'node:crypto';

import { HttpMethod } from '@activepieces/pieces-common';

import { GoogleWorkspaceApi, REPORTS_PATH } from './client';
import type { ResolvedAuth } from './client';

export const CHANNEL_MAX_LIFETIME_MS = 6 * 60 * 60 * 1000;
export const CHANNEL_RENEW_CRON = '0 */5 * * *';

export const ACTIVITY_APPLICATIONS: { label: string; value: string }[] = [
  { label: 'Admin console', value: 'admin' },
  { label: 'Login', value: 'login' },
  { label: 'User accounts', value: 'user_accounts' },
  { label: 'Drive', value: 'drive' },
  { label: 'Gmail', value: 'gmail' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Groups', value: 'groups' },
  { label: 'Groups Enterprise', value: 'groups_enterprise' },
  { label: 'Chat', value: 'chat' },
  { label: 'Meet', value: 'meet' },
  { label: 'Meet hardware', value: 'meet_hardware' },
  { label: 'Mobile devices', value: 'mobile' },
  { label: 'Chrome', value: 'chrome' },
  { label: 'Chrome sync', value: 'chrome_sync' },
  { label: 'OAuth tokens', value: 'token' },
  { label: 'SAML', value: 'saml' },
  { label: 'Rules', value: 'rules' },
  { label: 'Context-aware access', value: 'context_aware_access' },
  { label: 'Access transparency', value: 'access_transparency' },
  { label: 'Access evaluation', value: 'access_evaluation' },
  { label: 'Admin data actions', value: 'admin_data_action' },
  { label: 'Google Cloud', value: 'gcp' },
  { label: 'Looker Studio', value: 'data_studio' },
  { label: 'Keep', value: 'keep' },
  { label: 'Vault', value: 'vault' },
  { label: 'Classroom', value: 'classroom' },
  { label: 'Assignments', value: 'assignments' },
  { label: 'Cloud Search', value: 'cloud_search' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Contacts', value: 'contacts' },
  { label: 'Takeout', value: 'takeout' },
  { label: 'Voice', value: 'voice' },
  { label: 'Data migration', value: 'data_migration' },
  { label: 'Directory Sync', value: 'directory_sync' },
  { label: 'LDAP', value: 'ldap' },
  { label: 'Profile', value: 'profile' },
  { label: 'Graduation', value: 'graduation' },
  { label: 'Gemini in Workspace apps', value: 'gemini_in_workspace_apps' },
  { label: 'Workspace Studio', value: 'workspace_studio' },
  { label: 'Jamboard', value: 'jamboard' },
  { label: 'Google+', value: 'gplus' },
];

export const ReportsApi = {
  async listActivities({ auth, query }: { auth: ResolvedAuth; query: ActivityQuery }): Promise<Activity[]> {
    const { items } = await GoogleWorkspaceApi.listPage<Activity>({
      auth,
      path: activityPath({ query }),
      itemsKey: 'items',
      query: queryParams(query),
    });
    return items;
  },

  async watch({ auth, query, channel }: { auth: ResolvedAuth; query: ActivityQuery; channel: ChannelRequest }): Promise<Channel> {
    return GoogleWorkspaceApi.request<Channel>({
      auth,
      method: HttpMethod.POST,
      path: activityPath({ query, suffix: '/watch' }),
      query: queryParams(query),
      body: {
        id: channel.id,
        type: 'web_hook',
        address: channel.address,
        token: channel.token,
        expiration: String(channel.expiration),
        payload: true,
      },
    });
  },

  async stop({ auth, channel }: { auth: ResolvedAuth; channel: Pick<Channel, 'id' | 'resourceId'> }): Promise<void> {
    await GoogleWorkspaceApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: 'admin/reports_v1/channels/stop',
      body: { id: channel.id, resourceId: channel.resourceId },
    });
  },
};

export function newChannelRequest({ address, now = Date.now() }: { address: string; now?: number }): ChannelRequest {
  return { id: randomUUID(), address, token: randomUUID(), expiration: now + CHANNEL_MAX_LIFETIME_MS };
}

export function flattenActivity(activity: Activity): ActivityEvent[] {
  const events = activity.events ?? [];
  const base = `${activity.id?.time ?? ''}:${activity.id?.uniqueQualifier ?? ''}`;
  return events.map((event, index) => ({
    id: events.length > 1 ? `${base}:${index}` : base,
    time: activity.id?.time ?? null,
    application: activity.id?.applicationName ?? null,
    eventType: event.type ?? null,
    eventName: event.name ?? null,
    actor: {
      email: activity.actor?.email ?? null,
      profileId: activity.actor?.profileId ?? null,
      callerType: activity.actor?.callerType ?? null,
    },
    ipAddress: activity.ipAddress ?? null,
    ownerDomain: activity.ownerDomain ?? null,
    parameters: Object.fromEntries(
      (event.parameters ?? []).flatMap((p): [string, unknown][] => (p.name ? [[p.name, parameterValue(p)]] : []))
    ),
    activity,
  }));
}

export function isActivity(body: unknown): body is Activity {
  return typeof body === 'object' && body !== null && 'events' in body && Array.isArray(body.events);
}

export const SAMPLE_EVENT: ActivityEvent = {
  id: '2026-10-05T12:34:56.789Z:8721456339812',
  time: '2026-10-05T12:34:56.789Z',
  application: 'admin',
  eventType: 'USER_SETTINGS',
  eventName: 'CREATE_USER',
  actor: { email: 'admin@example.com', profileId: '104938271650192837465', callerType: 'USER' },
  ipAddress: '203.0.113.10',
  ownerDomain: 'example.com',
  parameters: { USER_EMAIL: 'jane.doe@example.com' },
  activity: {
    kind: 'admin#reports#activity',
    id: { time: '2026-10-05T12:34:56.789Z', uniqueQualifier: '8721456339812', applicationName: 'admin', customerId: 'C01abcd2e' },
    actor: { email: 'admin@example.com', profileId: '104938271650192837465', callerType: 'USER' },
    ownerDomain: 'example.com',
    ipAddress: '203.0.113.10',
    events: [{ type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [{ name: 'USER_EMAIL', value: 'jane.doe@example.com' }] }],
  },
};

function activityPath({ query, suffix = '' }: { query: ActivityQuery; suffix?: string }): string {
  const userKey = encodeURIComponent((query.userKey ?? 'all').trim() || 'all');
  return `${REPORTS_PATH}/activity/users/${userKey}/applications/${encodeURIComponent(query.application)}${suffix}`;
}

function queryParams(query: ActivityQuery): Record<string, string | number | undefined> {
  return {
    eventName: query.eventName?.trim() || undefined,
    filters: query.filters?.trim() || undefined,
    startTime: query.startTime,
    maxResults: query.maxResults,
  };
}

function parameterValue(p: ActivityParameter): unknown {
  if (p.value !== undefined) return p.value;
  if (p.intValue !== undefined) return p.intValue;
  if (p.boolValue !== undefined) return p.boolValue;
  if (p.multiValue !== undefined) return p.multiValue;
  if (p.multiIntValue !== undefined) return p.multiIntValue;
  if (p.messageValue !== undefined) return p.messageValue;
  if (p.multiMessageValue !== undefined) return p.multiMessageValue;
  return null;
}

export type ActivityQuery = {
  application: string;
  userKey?: string;
  eventName?: string;
  filters?: string;
  startTime?: string;
  maxResults?: number;
};

export type ChannelRequest = { id: string; address: string; token: string; expiration: number };

export type Channel = {
  id: string;
  resourceId: string;
  resourceUri?: string;
  token?: string;
  expiration?: string;
};

export type ActivityParameter = {
  name?: string;
  value?: string;
  intValue?: string;
  boolValue?: boolean;
  multiValue?: string[];
  multiIntValue?: string[];
  messageValue?: unknown;
  multiMessageValue?: unknown[];
};

export type Activity = {
  kind?: string;
  id?: { time?: string; uniqueQualifier?: string; applicationName?: string; customerId?: string };
  actor?: { email?: string; profileId?: string; callerType?: string; key?: string };
  ownerDomain?: string;
  ipAddress?: string;
  events?: { type?: string; name?: string; parameters?: ActivityParameter[] }[];
};

export type ActivityEvent = {
  id: string;
  time: string | null;
  application: string | null;
  eventType: string | null;
  eventName: string | null;
  actor: { email: string | null; profileId: string | null; callerType: string | null };
  ipAddress: string | null;
  ownerDomain: string | null;
  parameters: Record<string, unknown>;
  activity: Activity;
};
