import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotApiCall, MONITOR_STATUSES, MONITOR_TYPES } from '../common';

interface MonitorLog {
  type: number;
  datetime: number;
  duration: number;
  reason?: {
    code: string;
    detail: string;
  };
}

interface MonitorWithLogs {
  id: number;
  friendly_name: string;
  url: string;
  type: number;
  status: number;
  logs?: MonitorLog[];
}

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await uptimeRobotApiCall<{
      stat: string;
      monitors: MonitorWithLogs[];
    }>({
      apiKey: auth,
      endpoint: 'getMonitors',
      body: {
        logs: 1,
        logs_limit: 50,
      },
    });

    if (response.body.stat !== 'ok' || !response.body.monitors) {
      return [];
    }

    const events: Array<{ epochMilliSeconds: number; data: Record<string, unknown> }> = [];

    for (const monitor of response.body.monitors) {
      for (const log of monitor.logs ?? []) {
        events.push({
          epochMilliSeconds: log.datetime * 1000,
          data: {
            monitor_id: monitor.id,
            monitor_name: monitor.friendly_name,
            monitor_url: monitor.url,
            monitor_type: monitor.type,
            monitor_type_name: MONITOR_TYPES[monitor.type] ?? 'Unknown',
            current_status: monitor.status,
            current_status_name: MONITOR_STATUSES[monitor.status] ?? 'Unknown',
            event_type: log.type,
            event_type_name: { 1: 'Down', 2: 'Up', 98: 'Started', 99: 'Paused' }[log.type] ?? `Unknown (${log.type})`,
            event_datetime: new Date(log.datetime * 1000).toISOString(),
            duration_seconds: log.duration,
            reason_code: log.reason?.code ?? null,
            reason_detail: log.reason?.detail ?? null,
          },
        });
      }
    }

    return events;
  },
};

export const monitorStatusChangeTrigger = createTrigger({
  auth: uptimeRobotAuth,
  name: 'monitor_status_change',
  displayName: 'Monitor Status Change',
  description: 'Triggers when a monitor goes down, comes back up, or is paused. Checks every polling interval.',
  props: {},
  sampleData: {
    monitor_id: 123456,
    monitor_name: 'My Website',
    monitor_url: 'https://example.com',
    monitor_type: 1,
    monitor_type_name: 'HTTP(s)',
    current_status: 9,
    current_status_name: 'Down',
    event_type: 1,
    event_type_name: 'Down',
    event_datetime: '2026-04-27T12:00:00.000Z',
    duration_seconds: 0,
    reason_code: '200',
    reason_detail: 'OK',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
