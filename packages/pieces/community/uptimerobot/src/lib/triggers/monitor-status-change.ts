import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  uptimeRobotApiCall,
  UptimeRobotMonitorsResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

const LOG_TYPE_DOWN = 1;
const LOG_TYPE_UP = 2;

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof uptimeRobotAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const data = await uptimeRobotApiCall<UptimeRobotMonitorsResponse>({
      apiKey: auth.secret_text,
      endpoint: 'getMonitors',
      body: {
        limit: 50,
        offset: 0,
        logs: 1,
        logs_limit: 50,
      },
    });

    const events: { epochMilliSeconds: number; data: MonitorStatusEvent }[] = [];

    for (const monitor of data.monitors) {
      const logs = monitor.logs ?? [];

      for (const log of logs) {
        // Only emit events for down (1) and up (2) — ignore paused/started
        if (log.type !== LOG_TYPE_DOWN && log.type !== LOG_TYPE_UP) {
          continue;
        }

        events.push({
          epochMilliSeconds: log.datetime * 1000,
          data: {
            monitor_id: String(monitor.id),
            monitor_name: monitor.friendly_name,
            monitor_url: monitor.url,
            event_type: log.type === LOG_TYPE_DOWN ? 'down' : 'up',
            event_datetime: new Date(log.datetime * 1000).toISOString(),
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
  description: 'Triggers when a monitor goes up or down',
  props: {},
  sampleData: {
    monitor_id: '123456789',
    monitor_name: 'Company Website',
    monitor_url: 'https://example.com',
    event_type: 'down',
    event_datetime: '2024-03-15T10:30:00Z',
    reason_code: null,
    reason_detail: null,
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

interface MonitorStatusEvent {
  monitor_id: string;
  monitor_name: string;
  monitor_url: string;
  event_type: 'down' | 'up';
  event_datetime: string;
  reason_code: number | null;
  reason_detail: string | null;
}
