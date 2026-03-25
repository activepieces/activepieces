import { Property } from '@activepieces/pieces-framework';

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

export const serviceIdProp = Property.ShortText({
  displayName: 'Service ID',
  description:
    'PagerDuty REST incident creation uses a service reference. Routing keys belong to the Events API and are not used by POST /incidents.',
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
