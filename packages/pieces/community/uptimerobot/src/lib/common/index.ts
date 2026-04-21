import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../auth';
import { toFormUrlEncoded } from './form';

const BASE_URL = 'https://api.uptimerobot.com/v2';
const MAX_MONITORS_PER_PAGE = 50;
const MAX_DROPDOWN_MONITORS = 500;

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

function statusLabel(status: number): string {
  return MONITOR_STATUS_MAP[status] ?? String(status);
}

async function callApi<T extends UptimeRobotBaseResponse>({
  apiKey,
  endpoint,
  body,
}: {
  apiKey: string;
  endpoint: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const payload = { api_key: apiKey, format: 'json', ...body };

  let response;
  try {
    response = await httpClient.sendRequest<T>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/${endpoint}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: toFormUrlEncoded(payload),
    });
  } catch (e) {
    const err = e as { response?: { status?: number } };
    const status = err.response?.status;
    if (status === 429) {
      throw new Error(
        'UptimeRobot rate limit exceeded (Free plan: 10 req/min). Wait a moment and retry, or upgrade your plan.',
      );
    }
    if (status !== undefined && status >= 500) {
      throw new Error(
        `UptimeRobot is unavailable (HTTP ${status}). Please try again shortly.`,
      );
    }
    throw new Error(
      `UptimeRobot API request failed${status ? ` (HTTP ${status})` : ''}: ${endpoint}`,
    );
  }

  if (response.body.stat === 'fail') {
    throw new Error(response.body.error?.message ?? 'UptimeRobot API request failed');
  }

  return response.body;
}

async function fetchAllMonitors({
  apiKey,
  additionalBody,
  shouldStop,
}: {
  apiKey: string;
  additionalBody?: Record<string, unknown>;
  shouldStop?: (all: UptimeRobotMonitor[]) => boolean;
}): Promise<UptimeRobotMonitor[]> {
  const all: UptimeRobotMonitor[] = [];
  let offset = 0;
  while (true) {
    const data = await callApi<UptimeRobotMonitorsResponse>({
      apiKey,
      endpoint: 'getMonitors',
      body: { limit: MAX_MONITORS_PER_PAGE, offset, ...additionalBody },
    });
    all.push(...data.monitors);
    if (shouldStop && shouldStop(all)) break;
    offset += MAX_MONITORS_PER_PAGE;
    if (data.monitors.length < MAX_MONITORS_PER_PAGE) break;
    if (offset >= data.pagination.total) break;
  }
  return all;
}

function flattenMonitor({ monitor }: { monitor: UptimeRobotMonitor }): FlatMonitor {
  return {
    id: String(monitor.id),
    friendly_name: monitor.friendly_name,
    url: monitor.url,
    type: MONITOR_TYPE_MAP[monitor.type] ?? String(monitor.type),
    status: statusLabel(monitor.status),
    interval_seconds: monitor.interval,
    uptime_ratio_30d: monitor.custom_uptime_ratio ?? null,
    average_response_time_ms: monitor.average_response_time
      ? Number(monitor.average_response_time)
      : null,
  };
}

async function fetchFlatMonitorById({
  apiKey,
  id,
}: {
  apiKey: string;
  id: number | string;
}): Promise<FlatMonitor | null> {
  const data = await callApi<UptimeRobotMonitorsResponse>({
    apiKey,
    endpoint: 'getMonitors',
    body: {
      monitors: String(id),
      custom_uptime_ratios: '30',
      response_times: 1,
    },
  });
  const monitor = data.monitors[0];
  return monitor ? flattenMonitor({ monitor }) : null;
}

async function buildMonitorOptions({
  auth,
  searchValue,
}: {
  auth: { secret_text: string } | undefined;
  searchValue?: string;
}): Promise<{
  disabled: boolean;
  options: { label: string; value: string }[];
  placeholder?: string;
}> {
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please connect your UptimeRobot account first',
    };
  }
  try {
    const additionalBody: Record<string, unknown> = {};
    if (searchValue) additionalBody['search'] = searchValue;
    const monitors = await fetchAllMonitors({
      apiKey: auth.secret_text,
      additionalBody,
      shouldStop: (all) => all.length >= MAX_DROPDOWN_MONITORS,
    });
    if (monitors.length === 0) {
      return {
        disabled: false,
        options: [],
        placeholder: searchValue
          ? 'No monitors match your search'
          : 'No monitors found. Create one in UptimeRobot first.',
      };
    }
    const capped = monitors.slice(0, MAX_DROPDOWN_MONITORS);
    const truncated = monitors.length >= MAX_DROPDOWN_MONITORS;
    return {
      disabled: false,
      options: capped.map((m) => ({
        label: `${m.friendly_name} (${m.url}) — ${statusLabel(m.status)}`,
        value: String(m.id),
      })),
      ...(truncated
        ? {
            placeholder: `Showing first ${MAX_DROPDOWN_MONITORS} monitors — type to search for more`,
          }
        : {}),
    };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: 'Failed to load monitors. Check your API key.',
    };
  }
}

export const uptimeRobotCommon = {
  apiCall: callApi,
  fetchAllMonitors,
  fetchFlatMonitorById,
  flattenMonitor,
  buildMonitorOptions,
  monitorDropdown: Property.Dropdown({
    displayName: 'Monitor',
    description: 'Select the monitor to act on',
    refreshers: [],
    refreshOnSearch: true,
    required: true,
    auth: uptimeRobotAuth,
    options: async ({ auth }, { searchValue }) =>
      buildMonitorOptions({ auth, searchValue: searchValue ?? undefined }),
  }),
  monitorDropdownOptional: Property.Dropdown({
    displayName: 'Monitor',
    description:
      'Select the monitor to act on, or leave blank and use "Monitor ID" below to pass a dynamic value.',
    refreshers: [],
    refreshOnSearch: true,
    required: false,
    auth: uptimeRobotAuth,
    options: async ({ auth }, { searchValue }) =>
      buildMonitorOptions({ auth, searchValue: searchValue ?? undefined }),
  }),
  monitorMultiSelect: Property.MultiSelectDropdown({
    displayName: 'Monitors',
    description:
      'Filter to specific monitors. Leave empty to include all monitors in your account.',
    refreshers: [],
    refreshOnSearch: true,
    required: false,
    auth: uptimeRobotAuth,
    options: async ({ auth }, { searchValue }) =>
      buildMonitorOptions({ auth, searchValue: searchValue ?? undefined }),
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
