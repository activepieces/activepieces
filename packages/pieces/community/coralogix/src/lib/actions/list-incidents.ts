import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const listIncidents = createAction({
  auth: coralogixAuth,
  name: 'listIncidents',
  displayName: 'List Incidents',
  description: 'Retrieve a filtered list of Coralogix incidents.',
  requireAuth: true,
  props: {
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Filter by incident status. Leave empty to return all.',
      required: false,
      options: {
        options: [
          { label: 'Triggered', value: 'INCIDENT_STATUS_TRIGGERED' },
          { label: 'Acknowledged', value: 'INCIDENT_STATUS_ACKNOWLEDGED' },
          { label: 'Resolved', value: 'INCIDENT_STATUS_RESOLVED' },
        ],
      },
    }),
    severity: Property.StaticMultiSelectDropdown({
      displayName: 'Severity',
      description: 'Filter by incident severity. Leave empty to return all.',
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
    applicationName: Property.Array({
      displayName: 'Application Names',
      description: 'Filter by application name(s). Leave empty to return all.',
      required: false,
      defaultValue: [],
    }),
    subsystemName: Property.Array({
      displayName: 'Subsystem Names',
      description: 'Filter by subsystem name(s). Leave empty to return all.',
      required: false,
      defaultValue: [],
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of incidents to return.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    const { status, severity, applicationName, subsystemName, pageSize } =
      propsValue;

    const params: string[] = [];

    if (status && (status as string[]).length > 0) {
      (status as string[]).forEach((s) =>
        params.push(`filter.status=${encodeURIComponent(s)}`)
      );
    }
    if (severity && (severity as string[]).length > 0) {
      (severity as string[]).forEach((s) =>
        params.push(`filter.severity=${encodeURIComponent(s)}`)
      );
    }
    if (applicationName && (applicationName as string[]).length > 0) {
      (applicationName as string[]).forEach((a) =>
        params.push(`filter.applicationName=${encodeURIComponent(a)}`)
      );
    }
    if (subsystemName && (subsystemName as string[]).length > 0) {
      (subsystemName as string[]).forEach((s) =>
        params.push(`filter.subsystemName=${encodeURIComponent(s)}`)
      );
    }
    params.push(`pagination.pageSize=${pageSize ?? 20}`);

    const queryString = params.join('&');

    return await makeRequest(
      auth,
      'management',
      HttpMethod.POST,
      `/mgmt/openapi/latest/incidents/incidents/v1?${queryString}`
    );
  },
});
