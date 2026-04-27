import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotApiCall, flattenMonitor } from '../common';

export const createMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'create_monitor',
  displayName: 'Create Monitor',
  description: 'Creates a new monitor to track the uptime of a URL, IP address, or port',
  props: {
    friendly_name: Property.ShortText({
      displayName: 'Monitor Name',
      description: 'A friendly name for the monitor (e.g. "Production API" or "Company Website")',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL or IP',
      description: 'The URL or IP address to monitor (e.g. "https://example.com" or "192.168.1.1")',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Monitor Type',
      description: 'The type of monitoring to perform',
      required: true,
      defaultValue: '1',
      options: {
        options: [
          { label: 'HTTP(s) — Check if the URL responds with a success status', value: '1' },
          { label: 'Keyword — Check if a specific word exists (or not) on the page', value: '2' },
          { label: 'Ping — Send a ping to an IP address', value: '3' },
          { label: 'Port — Check if a specific port is open', value: '4' },
          { label: 'Heartbeat — Expect a periodic ping from your server', value: '5' },
        ],
      },
    }),
    interval: Property.Number({
      displayName: 'Check Interval (seconds)',
      description: 'How often to check, in seconds. Free plan minimum is 300 (5 minutes). Pro plan minimum is 60.',
      required: false,
      defaultValue: 300,
    }),
    keyword_type: Property.StaticDropdown({
      displayName: 'Keyword Type',
      description: 'Only for Keyword monitors — whether the keyword should exist or not exist on the page',
      required: false,
      options: {
        options: [
          { label: 'Keyword Exists — Alert if the keyword disappears', value: '1' },
          { label: 'Keyword Not Exists — Alert if the keyword appears', value: '2' },
        ],
      },
    }),
    keyword_value: Property.ShortText({
      displayName: 'Keyword',
      description: 'Only for Keyword monitors — the exact text to search for on the page',
      required: false,
    }),
    port: Property.Number({
      displayName: 'Port Number',
      description: 'Only for Port monitors — the port number to check (e.g. 443, 3306, 6379)',
      required: false,
    }),
    http_username: Property.ShortText({
      displayName: 'HTTP Username',
      description: 'Only if the URL requires HTTP Basic Authentication',
      required: false,
    }),
    http_password: Property.SecretText({
      displayName: 'HTTP Password',
      description: 'Only if the URL requires HTTP Basic Authentication',
      required: false,
    }),
    alert_contacts: Property.ShortText({
      displayName: 'Alert Contact IDs',
      description: 'Comma-separated alert contact IDs to notify (e.g. "123_0_0-456_0_0"). Get IDs from the "Get Alert Contacts" action.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      friendly_name: context.propsValue.friendly_name,
      url: context.propsValue.url,
      type: Number(context.propsValue.type),
    };

    if (context.propsValue.interval) {
      body['interval'] = context.propsValue.interval;
    }
    if (context.propsValue.keyword_type) {
      body['keyword_type'] = Number(context.propsValue.keyword_type);
    }
    if (context.propsValue.keyword_value) {
      body['keyword_value'] = context.propsValue.keyword_value;
    }
    if (context.propsValue.port) {
      body['port'] = context.propsValue.port;
    }
    if (context.propsValue.http_username) {
      body['http_username'] = context.propsValue.http_username;
    }
    if (context.propsValue.http_password) {
      body['http_password'] = context.propsValue.http_password;
    }
    if (context.propsValue.alert_contacts) {
      body['alert_contacts'] = context.propsValue.alert_contacts;
    }

    const response = await uptimeRobotApiCall<{
      stat: string;
      monitor: { id: number; status: number };
    }>({
      apiKey: context.auth as unknown as string,
      endpoint: 'newMonitor',
      body,
    });

    if (response.body.stat !== 'ok') {
      throw new Error(`Failed to create monitor: ${JSON.stringify(response.body)}`);
    }

    return {
      id: response.body.monitor.id,
      status: response.body.monitor.status,
      friendly_name: context.propsValue.friendly_name,
      url: context.propsValue.url,
      type: Number(context.propsValue.type),
    };
  },
});
