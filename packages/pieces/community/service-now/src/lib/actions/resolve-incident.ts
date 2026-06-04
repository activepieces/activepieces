import { createAction, Property } from '@activepieces/pieces-framework';
import { ServiceNowRecordSchema } from '../common/types';
import { createServiceNowClient, servicenowAuth } from '../common/props';

export const resolveIncidentAction = createAction({
  auth: servicenowAuth,
  name: 'resolve_incident',
  displayName: 'Resolve or Close Incident',
  description:
    'Move an incident to Resolved or Closed with a close code and resolution notes',
  props: {
    incident_sys_id: Property.ShortText({
      displayName: 'Incident sys_id',
      description: 'sys_id of the incident to resolve or close',
      required: true,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description:
        'Resolved keeps the record open for closure later; Closed finalizes it.',
      required: true,
      defaultValue: 'resolved',
      options: {
        disabled: false,
        options: [
          { label: 'Resolved', value: 'resolved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    close_code: Property.ShortText({
      displayName: 'Close Code',
      description:
        'Close code (e.g., "Solved (Permanently)", "Solved Remotely", "Not Solved (Not Reproducible)")',
      required: true,
    }),
    close_notes: Property.LongText({
      displayName: 'Resolution Notes',
      description: 'Resolution notes shown to the caller',
      required: true,
    }),
    resolved_by: Property.ShortText({
      displayName: 'Resolved By (User sys_id)',
      description:
        'Optional sys_id of the user who resolved the incident. Defaults to the authenticated user.',
      required: false,
    }),
  },
  async run(context) {
    const { incident_sys_id, resolution, close_code, close_notes, resolved_by } =
      context.propsValue;

    const fields: Record<string, unknown> = {
      state:
        resolution === 'closed' ? INCIDENT_STATE.CLOSED : INCIDENT_STATE.RESOLVED,
      close_code,
      close_notes,
    };
    if (resolved_by) {
      fields['resolved_by'] = resolved_by;
    }

    const client = createServiceNowClient(context.auth);
    const result = await client.updateRecord(
      'incident',
      incident_sys_id,
      fields
    );

    return ServiceNowRecordSchema.parse(result);
  },
});

const INCIDENT_STATE = {
  RESOLVED: '6',
  CLOSED: '7',
} as const;
