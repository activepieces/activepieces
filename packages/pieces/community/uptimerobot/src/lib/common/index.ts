import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.uptimerobot.com/v2';
const PAGE_LIMIT = 50;

export async function uptimeRobotApiCall<T extends HttpMessageBody>({
  apiKey,
  endpoint,
  body,
}: {
  apiKey: string;
  endpoint: string;
  body?: Record<string, unknown>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${BASE_URL}/${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      api_key: apiKey,
      format: 'json',
      ...body,
    },
  });
}

interface PaginatedResponse<T> {
  stat: string;
  pagination: { offset: number; limit: number; total: number };
  monitors?: T[];
  alert_contacts?: T[];
}

export async function uptimeRobotPaginatedCall<T>({
  apiKey,
  endpoint,
  listKey,
  body,
}: {
  apiKey: string;
  endpoint: string;
  listKey: 'monitors' | 'alert_contacts';
  body?: Record<string, unknown>;
}): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await uptimeRobotApiCall<PaginatedResponse<T>>({
      apiKey,
      endpoint,
      body: {
        ...body,
        offset,
        limit: PAGE_LIMIT,
      },
    });

    if (response.body.stat !== 'ok') {
      throw new Error(`UptimeRobot API error: ${JSON.stringify(response.body)}`);
    }

    const items = response.body[listKey] ?? [];
    results.push(...items);

    const pagination = response.body.pagination;
    if (pagination && offset + PAGE_LIMIT < pagination.total) {
      offset += PAGE_LIMIT;
    } else {
      hasMore = false;
    }
  }

  return results;
}

export const MONITOR_TYPES: Record<number, string> = {
  1: 'HTTP(s)',
  2: 'Keyword',
  3: 'Ping',
  4: 'Port',
  5: 'Heartbeat',
};

export const MONITOR_STATUSES: Record<number, string> = {
  0: 'Paused',
  1: 'Not checked yet',
  2: 'Up',
  8: 'Seems down',
  9: 'Down',
};

export const monitorDropdown = Property.Dropdown({
  displayName: 'Monitor',
  description: 'Select the monitor to use',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const monitors = await uptimeRobotPaginatedCall<{
        id: number;
        friendly_name: string;
        url: string;
      }>({
        apiKey: auth as string,
        endpoint: 'getMonitors',
        listKey: 'monitors',
      });
      return {
        disabled: false,
        options: monitors.map((m) => ({
          label: `${m.friendly_name} (${m.url})`,
          value: String(m.id),
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load monitors. Check your connection.' };
    }
  },
});

interface UptimeRobotMonitor {
  id: number;
  friendly_name: string;
  url: string;
  type: number;
  status: number;
  interval: number;
  create_datetime: number;
  keyword_type?: number;
  keyword_value?: string;
  http_username?: string;
  port?: string;
  sub_type?: string;
}

export function flattenMonitor(monitor: UptimeRobotMonitor): Record<string, unknown> {
  return {
    id: monitor.id,
    friendly_name: monitor.friendly_name,
    url: monitor.url,
    type: monitor.type,
    type_name: MONITOR_TYPES[monitor.type] ?? 'Unknown',
    status: monitor.status,
    status_name: MONITOR_STATUSES[monitor.status] ?? 'Unknown',
    interval_seconds: monitor.interval,
    created_at: monitor.create_datetime
      ? new Date(monitor.create_datetime * 1000).toISOString()
      : null,
    keyword_type: monitor.keyword_type ?? null,
    keyword_value: monitor.keyword_value ?? null,
    port: monitor.port ?? null,
  };
}
