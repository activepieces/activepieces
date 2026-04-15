import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../auth';

export async function uptimeRobotApiCall<T extends UptimeRobotBaseResponse>({
  apiKey,
  endpoint,
  body,
}: {
  apiKey: string;
  endpoint: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `https://api.uptimerobot.com/v2/${endpoint}`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      api_key: apiKey,
      format: 'json',
      ...body,
    },
  });

  if (response.body.stat === 'fail') {
    const msg = response.body.error?.message ?? 'UptimeRobot API request failed';
    throw new Error(msg);
  }

  return response.body;
}

export function flattenMonitor({
  monitor,
  upsertLastCheckAt,
}: {
  monitor: UptimeRobotMonitor;
  upsertLastCheckAt?: string | null;
}): FlatMonitor {
  return {
    id: String(monitor.id),
    friendly_name: monitor.friendly_name,
    url: monitor.url,
    type: monitorTypeMap[monitor.type] ?? String(monitor.type),
    status: monitorStatusMap[monitor.status] ?? String(monitor.status),
    interval_seconds: monitor.interval,
    uptime_ratio_30d: monitor.custom_uptime_ratio ?? null,
    average_response_time_ms: monitor.average_response_time
      ? Number(monitor.average_response_time)
      : null,
    last_check_at: upsertLastCheckAt ?? null,
  };
}

export const monitorDropdown = Property.Dropdown({
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
      const data = await uptimeRobotApiCall<UptimeRobotMonitorsResponse>({
        apiKey: auth.secret_text,
        endpoint: 'getMonitors',
        body: { limit: 50, offset: 0 },
      });
      if (!data.monitors || data.monitors.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No monitors found. Create one in UptimeRobot first.',
        };
      }
      return {
        disabled: false,
        options: data.monitors.map((m) => {
          const statusLabel = monitorStatusMap[m.status] ?? String(m.status);
          return {
            label: `${m.friendly_name} (${m.url}) — ${statusLabel}`,
            value: String(m.id),
          };
        }),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load monitors. Check your API key.',
      };
    }
  },
});

export const monitorTypeMap: Record<number, string> = {
  1: 'HTTP',
  2: 'Keyword',
  3: 'Ping',
  4: 'Port',
  5: 'Heartbeat',
};

export const monitorStatusMap: Record<number, string> = {
  0: 'Paused',
  1: 'Not checked yet',
  2: 'Up',
  8: 'Seems down',
  9: 'Down',
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

export interface UptimeRobotAccountResponse extends UptimeRobotBaseResponse {
  account: {
    email: string;
    user_id: number;
    firstname: string;
  };
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
  last_check_at: string | null;
}
