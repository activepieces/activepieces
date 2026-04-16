import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../auth';

const BASE_URL = 'https://api.uptimerobot.com/v2';
const MAX_MONITORS_PER_PAGE = 50;

const MONITOR_TYPE_MAP: Record<number, string> = {
  1: 'HTTP',
  2: 'Keyword',
  3: 'Ping',
  4: 'Port',
  5: 'Heartbeat',
};

const MONITOR_STATUS_MAP: Record<number, string> = {
  0: 'Paused',
  1: 'Not checked yet',
  2: 'Up',
  8: 'Seems down',
  9: 'Down',
};

function toFormUrlEncoded(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

export async function uptimeRobotApiCall<T extends UptimeRobotBaseResponse>({
  apiKey,
  endpoint,
  body,
}: {
  apiKey: string;
  endpoint: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const payload = {
    api_key: apiKey,
    format: 'json',
    ...body,
  };

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${BASE_URL}/${endpoint}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toFormUrlEncoded(payload),
  });

  if (response.body.stat === 'fail') {
    const msg = response.body.error?.message ?? 'UptimeRobot API request failed';
    throw new Error(msg);
  }

  return response.body;
}

export async function fetchAllMonitors({
  apiKey,
  additionalBody,
}: {
  apiKey: string;
  additionalBody?: Record<string, unknown>;
}): Promise<UptimeRobotMonitor[]> {
  const allMonitors: UptimeRobotMonitor[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await uptimeRobotApiCall<UptimeRobotMonitorsResponse>({
      apiKey,
      endpoint: 'getMonitors',
      body: {
        limit: MAX_MONITORS_PER_PAGE,
        offset,
        ...additionalBody,
      },
    });

    allMonitors.push(...data.monitors);
    offset += MAX_MONITORS_PER_PAGE;
    hasMore = data.monitors.length === MAX_MONITORS_PER_PAGE && offset < data.pagination.total;
  }

  return allMonitors;
}

export function flattenMonitor({ monitor }: { monitor: UptimeRobotMonitor }): FlatMonitor {
  return {
    id: String(monitor.id),
    friendly_name: monitor.friendly_name,
    url: monitor.url,
    type: MONITOR_TYPE_MAP[monitor.type] ?? String(monitor.type),
    status: MONITOR_STATUS_MAP[monitor.status] ?? String(monitor.status),
    interval_seconds: monitor.interval,
    uptime_ratio_30d: monitor.custom_uptime_ratio ?? null,
    average_response_time_ms: monitor.average_response_time
      ? Number(monitor.average_response_time)
      : null,
  };
}

export const uptimeRobotCommon = {
  MAX_MONITORS_PER_PAGE,
  MONITOR_TYPE_MAP,
  MONITOR_STATUS_MAP,
  monitorIdField: Property.ShortText({
    displayName: 'Monitor ID',
    description: 'The monitor ID. Use this for dynamic values from previous steps (e.g. from Create Monitor output).',
    required: false,
  }),
  monitorDropdownOptional: Property.Dropdown({
    displayName: 'Or Select Monitor',
    description: 'Select a monitor from the list. Ignored if Monitor ID above is provided.',
    refreshers: [],
    required: false,
    auth: uptimeRobotAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your UptimeRobot account first',
        };
      }
      try {
        const monitors = await fetchAllMonitors({
          apiKey: auth.secret_text,
        });
        if (monitors.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No monitors found. Create one in UptimeRobot first.',
          };
        }
        return {
          disabled: false,
          options: monitors.map((m) => {
            const statusLabel = MONITOR_STATUS_MAP[m.status] ?? String(m.status);
            return {
              label: `${m.friendly_name} (${m.url}) — ${statusLabel}`,
              value: String(m.id),
            };
          }),
        };
      } catch (error) {
        console.error('Failed to fetch monitors:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load monitors. Check your API key.',
        };
      }
    },
  }),
  monitorDropdown: Property.Dropdown({
    displayName: 'Monitor',
    description: 'Select the monitor to act on',
    refreshers: [],
    required: true,
    auth: uptimeRobotAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your UptimeRobot account first',
        };
      }
      try {
        const monitors = await fetchAllMonitors({
          apiKey: auth.secret_text,
        });
        if (monitors.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No monitors found. Create one in UptimeRobot first.',
          };
        }
        return {
          disabled: false,
          options: monitors.map((m) => {
            const statusLabel = MONITOR_STATUS_MAP[m.status] ?? String(m.status);
            return {
              label: `${m.friendly_name} (${m.url}) — ${statusLabel}`,
              value: String(m.id),
            };
          }),
        };
      } catch (error) {
        console.error('Failed to fetch monitors:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load monitors. Check your API key.',
        };
      }
    },
  }),
};

export interface UptimeRobotApiError {
  type: string;
  message: string;
}

export interface UptimeRobotBaseResponse {
  stat: 'ok' | 'fail';
  error?: UptimeRobotApiError;
}

export interface UptimeRobotLog {
  type: number;
  datetime: number;
  duration: number;
  reason?: {
    code: number;
    detail: string;
  };
}

export interface UptimeRobotMonitor {
  id: number;
  friendly_name: string;
  url: string;
  type: number;
  status: number;
  interval: number;
  custom_uptime_ratio?: string;
  average_response_time?: string;
  logs?: UptimeRobotLog[];
}

export interface UptimeRobotMonitorsResponse extends UptimeRobotBaseResponse {
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
  monitors: UptimeRobotMonitor[];
}

export interface UptimeRobotNewMonitorResponse extends UptimeRobotBaseResponse {
  monitor: {
    id: number;
    status: number;
  };
}

export interface UptimeRobotEditMonitorResponse extends UptimeRobotBaseResponse {
  monitor: {
    id: number;
  };
}

export interface UptimeRobotDeleteMonitorResponse extends UptimeRobotBaseResponse {
  monitor: {
    id: number;
  };
}

export interface FlatMonitor {
  id: string;
  friendly_name: string;
  url: string;
  type: string;
  status: string;
  interval_seconds: number;
  uptime_ratio_30d: string | null;
  average_response_time_ms: number | null;
}
