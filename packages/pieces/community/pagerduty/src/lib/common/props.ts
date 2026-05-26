import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { pagerDutyAuth } from '../auth';
import { pagerDutyApiCall } from './client';

export const serviceIdProp = Property.Dropdown({
  auth: pagerDutyAuth,
  displayName: 'Service',
  description: 'The PagerDuty service to associate with the incident.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    try {
      const services: { id: string; name: string }[] = [];
      let offset = 0;
      const limit = 100;
      let more = true;

      while (more) {
        const response = await pagerDutyApiCall({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          path: '/services',
          query: { limit: String(limit), offset: String(offset) },
        });

        const data = response as {
          services: { id: string; name: string }[];
          more: boolean;
        };
        services.push(...data.services);
        more = data.more;
        offset += limit;
      }

      return {
        disabled: false,
        options: services.map((s) => ({ label: s.name, value: s.id })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading services. Check your API key.',
      };
    }
  },
});

export const incidentIdProp = Property.ShortText({
  displayName: 'Incident ID',
  description: 'The PagerDuty incident ID, for example PABC123.',
  required: true,
});

export const fromEmailProp = Property.ShortText({
  displayName: 'From Email',
  description:
    'PagerDuty REST write operations require the email address of a valid PagerDuty user on the account.',
  required: true,
});

export const urgencyProp = Property.StaticDropdown({
  displayName: 'Urgency',
  description: 'The urgency for the incident.',
  required: true,
  defaultValue: 'high',
  options: {
    disabled: false,
    options: [
      { label: 'High', value: 'high' },
      { label: 'Low', value: 'low' },
    ],
  },
});

export const optionalUrgencyProp = Property.StaticDropdown({
  displayName: 'Urgency',
  description: 'Optional urgency filter.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'High', value: 'high' },
      { label: 'Low', value: 'low' },
    ],
  },
});

export const statusesProp = Property.StaticMultiSelectDropdown({
  displayName: 'Statuses',
  description: 'Optional incident status filters.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Triggered', value: 'triggered' },
      { label: 'Acknowledged', value: 'acknowledged' },
      { label: 'Resolved', value: 'resolved' },
    ],
  },
});

export const instructionProp = Property.MarkDown({
  value: `To receive new incident events, create a webhook subscription in PagerDuty with the following settings:
  - Go to **Integrations** > **Generic Webhook(V3)** in the PagerDuty dashboard.
  - Set the **Endpoint URL** {{webhookUrl}} to the URL of this trigger.
  - Add Scope types and Scope
  - Select event type.
  - create webhook
`,
});
