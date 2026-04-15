import { createAction, Property } from '@activepieces/pieces-framework';
import {
  flattenMonitor,
  uptimeRobotApiCall,
  UptimeRobotMonitorsResponse,
  UptimeRobotNewMonitorResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const createMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'create_monitor',
  displayName: 'Create Monitor',
  description: 'Create a new uptime monitor in UptimeRobot',
  props: {
    instructions: Property.MarkDown({
      value: `**Monitor type guide:**
- **HTTP** — checks if your website returns a successful HTTP response. Best for most websites and APIs.
- **Keyword** — loads the page and checks whether a specific word is present or absent. Useful for detecting error pages that return a 200 status code.
- **Ping** — sends an ICMP ping to a server or IP address.
- **Port** — checks if a specific TCP port is open on a host.`,
    }),
    friendly_name: Property.ShortText({
      displayName: 'Monitor Name',
      description: "A name for this monitor (e.g. 'Company Website' or 'API Server')",
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL or IP Address',
      description: "The URL or IP address to monitor (e.g. 'https://example.com')",
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Monitor Type',
      description: 'How UptimeRobot checks this target. HTTP is the most common.',
      required: true,
      defaultValue: 1,
      options: {
        options: [
          { label: 'HTTP (recommended for websites)', value: 1 },
          { label: 'Keyword (check page content)', value: 2 },
          { label: 'Ping (ICMP ping)', value: 3 },
          { label: 'Port (TCP port check)', value: 4 },
        ],
      },
    }),
    interval: Property.Number({
      displayName: 'Check Interval (seconds)',
      description:
        'How often UptimeRobot checks this URL. Minimum 60s on Free plan, 30s on Pro plan.',
      required: false,
      defaultValue: 300,
    }),
    keyword_type: Property.StaticDropdown({
      displayName: 'Keyword Condition',
      description: 'Whether the keyword must be present or absent on the page (Keyword monitors only).',
      required: false,
      options: {
        options: [
          { label: 'Keyword must exist on page', value: 2 },
          { label: 'Keyword must NOT exist on page', value: 1 },
        ],
      },
    }),
    keyword_value: Property.ShortText({
      displayName: 'Keyword',
      description: 'The word or phrase to look for on the page (Keyword monitors only).',
      required: false,
    }),
    sub_type: Property.StaticDropdown({
      displayName: 'Port Service',
      description: 'The service running on the port being monitored (Port monitors only).',
      required: false,
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
      description: 'The TCP port number to check (Port monitors with Custom service only).',
      required: false,
    }),
  },
  async run(context) {
    const {
      friendly_name,
      url,
      type,
      interval,
      keyword_type,
      keyword_value,
      sub_type,
      port,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      friendly_name,
      url,
      type,
    };

    if (interval !== undefined && interval !== null) body['interval'] = interval;
    if (keyword_type !== undefined && keyword_type !== null) body['keyword_type'] = keyword_type;
    if (keyword_value) body['keyword_value'] = keyword_value;
    if (sub_type !== undefined && sub_type !== null) body['sub_type'] = sub_type;
    if (port !== undefined && port !== null) body['port'] = port;

    const created = await uptimeRobotApiCall<UptimeRobotNewMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'newMonitor',
      body,
    });

    const data = await uptimeRobotApiCall<UptimeRobotMonitorsResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'getMonitors',
      body: {
        monitors: String(created.monitor.id),
        custom_uptime_ratios: '30',
        response_times: 1,
      },
    });

    const monitor = data.monitors[0];
    if (!monitor) {
      throw new Error('Monitor was created but could not be retrieved');
    }

    return flattenMonitor({ monitor });
  },
});
