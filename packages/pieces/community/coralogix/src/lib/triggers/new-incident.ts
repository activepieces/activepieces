import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const STORE_KEY = 'coralogix_seen_incident_ids';

export const newIncident = createTrigger({
  auth: coralogixAuth,
  name: 'newIncident',
  displayName: 'New Incident',
  description:
    'Triggers when a new incident appears in Coralogix. Polls on a schedule — ideal for paging on-call, creating Jira tickets, or posting to Slack.',
  type: TriggerStrategy.POLLING,
  props: {
    severity: Property.StaticMultiSelectDropdown({
      displayName: 'Severity Filter',
      description: 'Only trigger for incidents with these severities. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'Critical', value: 'INCIDENT_SEVERITY_CRITICAL' },
          { label: 'Error', value: 'INCIDENT_SEVERITY_ERROR' },
          { label: 'Warning', value: 'INCIDENT_SEVERITY_WARNING' },
          { label: 'Info', value: 'INCIDENT_SEVERITY_INFO' },
          { label: 'Low', value: 'INCIDENT_SEVERITY_LOW' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'incident-abc-123',
    name: 'High error rate detected',
    status: 'INCIDENT_STATUS_TRIGGERED',
    severity: 'INCIDENT_SEVERITY_CRITICAL',
    createdAt: '2024-04-15T07:26:04.848Z',
    applicationName: ['my-app'],
    subsystemName: ['payments'],
  },
  async onEnable(context) {
    const response = (await makeRequest(
      context.auth,
      'management',
      HttpMethod.POST,
      '/mgmt/openapi/latest/incidents/incidents/v1?filter.status=INCIDENT_STATUS_TRIGGERED&pagination.pageSize=100'
    )) as { incidents?: { id: string }[] };

    const ids = (response.incidents ?? []).map((i) => i.id);
    await context.store.put<string[]>(STORE_KEY, ids);
  },

  async onDisable() {
    // nothing to clean up
  },

  async run(context) {
    const seenIds = (await context.store.get<string[]>(STORE_KEY)) ?? [];

    const severityFilter = context.propsValue.severity as string[] | undefined;
    const params: string[] = [
      'filter.status=INCIDENT_STATUS_TRIGGERED',
      'pagination.pageSize=100',
    ];
    if (severityFilter && severityFilter.length > 0) {
      severityFilter.forEach((s) =>
        params.push(`filter.severity=${encodeURIComponent(s)}`)
      );
    }
    const queryString = params.join('&');

    const response = (await makeRequest(
      context.auth,
      'management',
      HttpMethod.POST,
      `/mgmt/openapi/latest/incidents/incidents/v1?${queryString}`
    )) as { incidents?: { id: string }[] };

    const incidents = response.incidents ?? [];
    const newIncidents = incidents.filter((i) => !seenIds.includes(i.id));

    const allIds = incidents.map((i) => i.id);
    // merge: keep old seen IDs + new ones so we don't re-trigger if severity filter changes
    const mergedIds = Array.from(new Set([...seenIds, ...allIds]));
    await context.store.put<string[]>(STORE_KEY, mergedIds);

    return newIncidents;
  },
});
