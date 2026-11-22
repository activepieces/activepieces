import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient, reformatDateTime } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'update_entry',
  classification: 'WRITE',
  displayName: 'Update Entry',
  description: 'Updates an entry in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Modifies an existing Clockodo time-record entry identified by entry_id, changing any of its customer, project, service, user, time window, or description. Use to correct or amend an already-logged entry rather than creating a new one (use Create Entry for new records). Idempotent: applying the same field values to the same entry_id converges to the same state.',
    idempotent: true,
  },
  props: {
    entry_id: Property.Number({
      displayName: 'Entry ID',
      description: 'Numeric ID of the time entry (from Get Entries).',
      placeholder: 'e.g. 158722301',
      required: true,
    }),
    customer_id: clockodoCommon.customer_id(false),
    project_id: clockodoCommon.project_id(false),
    service_id: clockodoCommon.service_id(false),
    time_since: Property.DateTime({
      displayName: 'Start Time',
      description: 'When the work started.',
      required: false,
    }),
    time_until: Property.DateTime({
      displayName: 'End Time',
      description: 'When the work ended (must be after Start Time).',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Description',
      description: 'Optional description of the work.',
      placeholder: 'e.g. Sprint planning',
      required: false,
    }),
    user_id: clockodoCommon.user_id(false),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.entry_id, field: 'Entry ID' });
    return makeClient(auth.props).updateEntry({
      id,
      request: clockodoRequests.entryUpdateBody({
        customers_id: clockodoRequests.parseOptionalId({ value: propsValue.customer_id, field: 'Customer' }),
        projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id, field: 'Project' }),
        services_id: clockodoRequests.parseOptionalId({ value: propsValue.service_id, field: 'Service' }),
        users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User' }),
        text: propsValue.text || undefined,
        time_since: reformatDateTime(propsValue.time_since),
        time_until: reformatDateTime(propsValue.time_until),
      }),
    });
  },
});
