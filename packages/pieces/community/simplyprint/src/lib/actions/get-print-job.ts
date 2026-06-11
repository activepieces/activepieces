import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const getPrintJobAction = createAction({
  auth: simplyprintAuth,
  name: 'get_print_job',
  displayName: 'Get Print Job',
  description:
    'Fetch a single print job\'s full record by its UID — timeline, pictures, spools used, gcode analysis, filament data, cost, AI inference, custom fields, etc.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one completed print job\'s full detail record by its print-job UID. Use to drill into a specific job after finding it via "List Print History" or a webhook; an optional flag also returns the custom-field schema alongside values. Requires the UID string (not a numeric ID). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    jobUid: Property.ShortText({
      displayName: 'Job UID',
      description: 'Print job UID string (typically 10+ characters). Comes from "List Print History" results or webhook payloads.',
      required: true,
    }),
    includeCustomFieldDefinitions: Property.Checkbox({
      displayName: 'Include custom field definitions',
      description: 'When true, also returns the schema for the custom fields attached to the job (vs just values).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // jobs/GetDetails reads `id` (the UID) and optional flags from $this->GET.
    const queryParams: Record<string, string> = { id: String(context.propsValue.jobUid) };
    if (context.propsValue.includeCustomFieldDefinitions) queryParams['getcustomfields'] = '1';

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'jobs/GetDetails',
      queryParams,
    });
  },
});
