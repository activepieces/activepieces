import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import {
  uptimeRobotCommon,
  UptimeRobotNewMonitorResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const createMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'create_monitor',
  displayName: 'Create HTTP Monitor',
  description: 'Create a new HTTP uptime monitor in UptimeRobot',
  props: {
    friendly_name: Property.ShortText({
      displayName: 'Monitor Name',
      description: "A name for this monitor (e.g. 'Company Website' or 'API Server')",
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        "The full URL to monitor, including the protocol (e.g. 'https://example.com').",
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Monitor Type',
      description:
        'Only HTTP monitors are supported at the moment. Other UptimeRobot types (Keyword, Ping, Port, Heartbeat) are not yet verified end-to-end and will be added in a future release.',
      required: true,
      defaultValue: 1,
      options: {
        options: [{ label: 'HTTP', value: 1 }],
      },
    }),
    interval: Property.Number({
      displayName: 'Check Interval (seconds)',
      description:
        'How often UptimeRobot checks this URL, in seconds. Minimum 300s (5 min) on the Free plan, 60s on Solo/Team, 30s on Enterprise.',
      required: false,
      defaultValue: 300,
    }),
    type_specific: Property.DynamicProperties({
      displayName: 'Type-Specific Settings',
      auth: uptimeRobotAuth,
      refreshers: ['type'],
      required: true,
      props: async ({ type }): Promise<DynamicPropsValue> => {
        const selected = Number(type);
        if (selected === 2) {
          return {
            keyword_type: Property.StaticDropdown({
              displayName: 'Keyword Condition',
              description:
                'When UptimeRobot should raise an alert. "Alert when exists" marks the monitor down the moment the keyword appears on the page; "Alert when does NOT exist" marks it down when the keyword is missing.',
              required: true,
              options: {
                options: [
                  { label: 'Alert when keyword exists on page', value: 1 },
                  { label: 'Alert when keyword does NOT exist on page', value: 2 },
                ],
              },
            }),
            keyword_value: Property.ShortText({
              displayName: 'Keyword',
              description: 'The word or phrase to look for on the page.',
              required: true,
            }),
          };
        }
        if (selected === 4) {
          return {
            sub_type: Property.StaticDropdown({
              displayName: 'Port Service',
              description: 'The service running on the port being monitored.',
              required: true,
              options: {
                options: [
                  { label: 'HTTP', value: 1 },
                  { label: 'HTTPS', value: 2 },
                  { label: 'FTP', value: 3 },
                  { label: 'SMTP', value: 4 },
                  { label: 'POP3', value: 5 },
                  { label: 'IMAP', value: 6 },
                  { label: 'Custom', value: 99 },
                ],
              },
            }),
            port: Property.Number({
              displayName: 'Port Number',
              description:
                'The TCP port number to check. Required when Port Service is set to Custom.',
              required: false,
            }),
          };
        }
        if (selected === 5) {
          return {
            heartbeat_note: Property.MarkDown({
              value:
                '**Heartbeat monitor:** UptimeRobot will generate a unique ping URL for this monitor after creation. ' +
                'Send an HTTP GET/POST to that URL from your service on your schedule — if UptimeRobot does not receive a ping within the interval above, an alert is raised.',
            }),
          };
        }
        return {};
      },
    }),
  },
  async run(context) {
    const { friendly_name, url, type, interval, type_specific } = context.propsValue;

    const body: Record<string, unknown> = { friendly_name, url, type };
    if (interval !== undefined && interval !== null) body['interval'] = interval;

    if (type === 2) {
      const keywordType = type_specific['keyword_type'];
      const keywordValue = type_specific['keyword_value'];
      if (!keywordType || !keywordValue) {
        throw new Error('Keyword monitors require both a Keyword and a Keyword Condition.');
      }
      body['keyword_type'] = keywordType;
      body['keyword_value'] = keywordValue;
    }

    if (type === 4) {
      const subType = type_specific['sub_type'];
      const port = type_specific['port'];
      if (!subType) {
        throw new Error('Port monitors require a Port Service.');
      }
      if (subType === 99 && (port === undefined || port === null)) {
        throw new Error('Custom port monitors require a Port Number.');
      }
      body['sub_type'] = subType;
      if (port !== undefined && port !== null) body['port'] = port;
    }

    const created = await uptimeRobotCommon.apiCall<UptimeRobotNewMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'newMonitor',
      body,
    });

    const flat = await uptimeRobotCommon.fetchFlatMonitorById({
      apiKey: context.auth.secret_text,
      id: created.monitor.id,
    });
    if (!flat) {
      throw new Error('Monitor was created but could not be retrieved.');
    }
    return flat;
  },
});
