import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

export const aiCreateEntry = createAction({
  auth: clockodoAuth,
  name: 'ai_create_entry',
  classification: 'WRITE',
  displayName: 'Create Entry',
  description: 'Creates an entry in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Logs a finished time entry in Clockodo for a customer id and service id between two ISO-8601 date-times with timezone (end after start), optionally with project id, user id (defaults to the connection user), description and hourly rate. Returns the entry with its id. Not idempotent: each call adds another entry.',
    idempotent: false,
  },
  props: {
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: true }),
    service_id: clockodoAiProps.id({ displayName: 'Service ID', source: 'Get Services', required: true }),
    time_since: clockodoAiProps.isoDateTime({ displayName: 'Start Time', required: true }),
    time_until: clockodoAiProps.isoDateTime({ displayName: 'End Time', required: true }),
    project_id: clockodoAiProps.id({ displayName: 'Project ID', source: 'Get Projects', required: false }),
    user_id: clockodoAiProps.id({ displayName: 'User ID', source: 'Get Users or Get Current User', required: false }),
    text: Property.LongText({ displayName: 'Description', required: false }),
    hourly_rate: Property.Number({ displayName: 'Hourly Rate', required: false }),
  },
  async run({ auth, propsValue }) {
    return makeClient(auth.props).createEntry(
      clockodoRequests.entryCreateBody({
        customers_id: clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer ID' }),
        services_id: clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service ID' }),
        projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id, field: 'Project ID' }),
        users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User ID' }),
        time_since: clockodoRequests.parseIsoDateTime({ value: propsValue.time_since, field: 'Start Time' }),
        time_until: clockodoRequests.parseIsoDateTime({ value: propsValue.time_until, field: 'End Time' }),
        text: propsValue.text || undefined,
        hourly_rate: propsValue.hourly_rate ?? undefined,
      })
    );
  },
});

export const aiUpdateEntry = createAction({
  auth: clockodoAuth,
  name: 'ai_update_entry',
  classification: 'WRITE',
  displayName: 'Update Entry',
  description: 'Updates an entry in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Changes only the fields you give on a Clockodo time entry identified by numeric entry id (from Get Entries): customer, project, service or user id, ISO-8601 start/end date-time with timezone, or description. At least one field is required. Idempotent.',
    idempotent: true,
  },
  props: {
    entry_id: clockodoAiProps.id({ displayName: 'Entry ID', source: 'Get Entries', required: true }),
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: false }),
    project_id: clockodoAiProps.id({ displayName: 'Project ID', source: 'Get Projects', required: false }),
    service_id: clockodoAiProps.id({ displayName: 'Service ID', source: 'Get Services', required: false }),
    user_id: clockodoAiProps.id({ displayName: 'User ID', source: 'Get Users', required: false }),
    time_since: clockodoAiProps.isoDateTime({ displayName: 'Start Time', required: false }),
    time_until: clockodoAiProps.isoDateTime({ displayName: 'End Time', required: false }),
    text: Property.LongText({ displayName: 'Description', required: false }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.entry_id, field: 'Entry ID' });
    return makeClient(auth.props).updateEntry({
      id,
      request: clockodoRequests.entryUpdateBody({
        customers_id: clockodoRequests.parseOptionalId({ value: propsValue.customer_id, field: 'Customer ID' }),
        projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id, field: 'Project ID' }),
        services_id: clockodoRequests.parseOptionalId({ value: propsValue.service_id, field: 'Service ID' }),
        users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User ID' }),
        time_since: clockodoAiProps.optionalIsoDateTime({ value: propsValue.time_since, field: 'Start Time' }),
        time_until: clockodoAiProps.optionalIsoDateTime({ value: propsValue.time_until, field: 'End Time' }),
        text: propsValue.text || undefined,
      }),
    });
  },
});
