import {
  AppConnectionValueForAuthProperty,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { uptimeRobotCommon } from '../common';
import { uptimeRobotAuth } from '../auth';

const LOG_TYPE_DOWN = 1;
const LOG_TYPE_UP = 2;
const LOGS_PER_MONITOR = 50;

const triggerProps = {
  event_type: Property.StaticDropdown({
    displayName: 'Event Type',
    description: 'Fire only on Down events, only on Up events, or on both.',
    required: true,
    defaultValue: 'down',
    options: {
      options: [
        { label: 'Down only', value: 'down' },
        { label: 'Up only', value: 'up' },
        { label: 'Both (up and down)', value: 'both' },
      ],
    },
  }),
  monitors: uptimeRobotCommon.monitorMultiSelect,
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof uptimeRobotAuth>,
  StaticPropsValue<typeof triggerProps>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const watermarkSec = Math.floor((lastFetchEpochMS ?? 0) / 1000);
    const additionalBody: Record<string, unknown> = {
      logs: 1,
      logs_limit: LOGS_PER_MONITOR,
    };
    if (watermarkSec > 0) {
      additionalBody['logs_start_date'] = watermarkSec;
    }
    if (propsValue.monitors && propsValue.monitors.length > 0) {
      additionalBody['monitors'] = propsValue.monitors.join('-');
    }

    const monitors = await uptimeRobotCommon.fetchAllMonitors({
      apiKey: auth.secret_text,
      additionalBody,
    });

    const events: { epochMilliSeconds: number; data: MonitorStatusEvent }[] = [];
    for (const monitor of monitors) {
      for (const log of monitor.logs ?? []) {
        if (log.type !== LOG_TYPE_DOWN && log.type !== LOG_TYPE_UP) continue;
        const eventType: 'down' | 'up' =
          log.type === LOG_TYPE_DOWN ? 'down' : 'up';
        if (
          propsValue.event_type !== 'both' &&
          propsValue.event_type !== eventType
        ) {
          continue;
        }
        events.push({
          epochMilliSeconds: log.datetime * 1000,
          data: {
            monitor_id: String(monitor.id),
            monitor_name: monitor.friendly_name,
            monitor_url: monitor.url,
            event_type: eventType,
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
  description:
    'Fires when a monitor goes up or down. Filter by event type and monitor set. ' +
    'Poll cadence is controlled by the Activepieces platform admin (typically every 5 minutes). ' +
    'Up to 50 status changes per monitor per poll are processed.',
  props: triggerProps,
  sampleData: {
    monitor_id: '123456789',
    monitor_name: 'Company Website',
    monitor_url: 'https://example.com',
    event_type: 'down',
    event_datetime: '2024-03-15T10:30:00Z',
    reason_code: 521,
    reason_detail: 'Web Server Is Down',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
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
