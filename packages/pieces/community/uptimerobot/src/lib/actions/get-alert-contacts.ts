import { createAction } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotApiCall } from '../common';

const ALERT_CONTACT_TYPES: Record<number, string> = {
  1: 'SMS',
  2: 'Email',
  3: 'Twitter DM',
  4: 'Boxcar',
  5: 'Web-Hook',
  6: 'Pushbullet',
  7: 'Zapier',
  9: 'Pushover',
  10: 'HipChat',
  11: 'Slack',
  14: 'Telegram',
  16: 'Microsoft Teams',
  17: 'Google Chat',
  20: 'Opsgenie',
};

const ALERT_CONTACT_STATUSES: Record<number, string> = {
  0: 'Not activated',
  1: 'Paused',
  2: 'Active',
};

export const getAlertContactsAction = createAction({
  auth: uptimeRobotAuth,
  name: 'get_alert_contacts',
  displayName: 'Get Alert Contacts',
  description: 'Retrieves all alert contacts configured in your UptimeRobot account. Use the IDs when creating monitors.',
  props: {},
  async run(context) {
    const response = await uptimeRobotApiCall<{
      stat: string;
      alert_contacts: Array<{
        id: string;
        friendly_name: string;
        type: number;
        status: number;
        value: string;
      }>;
    }>({
      apiKey: context.auth as unknown as string,
      endpoint: 'getAlertContacts',
    });

    if (response.body.stat !== 'ok') {
      throw new Error(`UptimeRobot API error: ${JSON.stringify(response.body)}`);
    }

    return (response.body.alert_contacts ?? []).map((c) => ({
      id: c.id,
      friendly_name: c.friendly_name,
      type: c.type,
      type_name: ALERT_CONTACT_TYPES[c.type] ?? 'Unknown',
      status: c.status,
      status_name: ALERT_CONTACT_STATUSES[c.status] ?? 'Unknown',
      value: c.value,
    }));
  },
});
