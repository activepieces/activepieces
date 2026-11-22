import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient, reformatDateTime } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_entry',
  classification: 'WRITE',
  displayName: 'Create Entry',
  description: 'Creates an entry in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Logs a new time-record entry in Clockodo for a customer and service over a start/end time window, optionally tagged to a project, user, hourly rate, and description. Use to record tracked work after the fact; requires customer_id, service_id, and both start and end times. Not idempotent: each call creates a separate entry, so guard against duplicates.',
    idempotent: false,
  },
  props: {
    customer_id: clockodoCommon.customer_id(),
    service_id: clockodoCommon.service_id(),
    time_since: Property.DateTime({
      displayName: 'Start Time',
      description: 'When the work started.',
      required: true,
    }),
    time_until: Property.DateTime({
      displayName: 'End Time',
      description: 'When the work ended (must be after Start Time).',
      required: true,
    }),
    project_id: clockodoCommon.project_id(false),
    text: Property.LongText({
      displayName: 'Description',
      description: 'Optional description of the work.',
      placeholder: 'e.g. Sprint planning',
      required: false,
    }),
    hourly_rate: Property.Number({
      displayName: 'Hourly Rate',
      description: 'Optional hourly rate for this entry; leave empty to use the default.',
      placeholder: 'e.g. 85',
      required: false,
    }),
    user_id: clockodoCommon.user_id(false),
  },
  async run({ auth, propsValue }) {
    const time_since = clockodoRequests.requireValue({ value: reformatDateTime(propsValue.time_since), field: 'Start Time' });
    const time_until = clockodoRequests.requireValue({ value: reformatDateTime(propsValue.time_until), field: 'End Time' });
    return makeClient(auth.props).createEntry(
      clockodoRequests.entryCreateBody({
        customers_id: clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer' }),
        projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id, field: 'Project' }),
        services_id: clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service' }),
        time_since,
        time_until,
        text: propsValue.text || undefined,
        hourly_rate: propsValue.hourly_rate ?? undefined,
        users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User' }),
      })
    );
  },
});
