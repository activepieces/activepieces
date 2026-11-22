import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

export const aiStartClock = createAction({
  auth: clockodoAuth,
  name: 'ai_start_clock',
  classification: 'WRITE',
  displayName: 'Start Clock',
  description: 'Starts the Clockodo stopwatch for a customer and service',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Starts the Clockodo stopwatch for the connection user on a numeric customer id and service id, optionally a project id, description and billable ("yes"/"no"), and returns the running entry (stop it with Stop Clock). Starting stops any clock that is already running (its entry ends at this start time), so check Get Running Clock first. Not idempotent: each call starts a new entry.',
    idempotent: false,
  },
  props: {
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: true }),
    service_id: clockodoAiProps.id({ displayName: 'Service ID', source: 'Get Services', required: true }),
    project_id: clockodoAiProps.id({ displayName: 'Project ID', source: 'Get Projects', required: false }),
    text: Property.LongText({ displayName: 'Description', required: false }),
    billable: clockodoAiProps.yesNo({ displayName: 'Billable', description: 'Whether the entry is billable.' }),
  },
  async run({ auth, propsValue }) {
    const billable = clockodoRequests.parseYesNo({ value: propsValue.billable, field: 'Billable' });
    const response = await makeClient(auth.props).startClock(
      clockodoRequests.clockStartBody({
        customers_id: clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer ID' }),
        services_id: clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service ID' }),
        projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id, field: 'Project ID' }),
        text: propsValue.text || undefined,
        billable: billable === undefined ? undefined : billable ? 1 : 0,
      })
    );
    return clockodoRequests.clockEntry({ response, operation: 'start clock' });
  },
});
