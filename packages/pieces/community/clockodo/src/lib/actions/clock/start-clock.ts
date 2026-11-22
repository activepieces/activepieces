import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'start_clock',
  classification: 'WRITE',
  displayName: 'Start Clock',
  description: 'Starts the Clockodo stopwatch for a customer and service',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Starts the Clockodo stopwatch for the connection user on a customer and service, optionally a project, description and billable flag, and returns the running entry. If a clock is already running, Clockodo stops it at this start time and the new entry starts. Not idempotent: each call starts a new entry.',
    idempotent: false,
  },
  props: {
    customer_id: clockodoCommon.customer_id(),
    service_id: clockodoCommon.service_id(),
    project_id: clockodoCommon.project_id(false),
    text: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Tick to start a billable entry. Unticked uses the customer/service default.',
      required: false,
    }),
    billable_status: clockodoCommon.keepYesNo({
      displayName: 'Billable Status',
      description: 'Yes or No forces billable; Keep or empty uses the customer/service default.',
    }),
  },
  async run({ auth, propsValue }) {
    const billable = clockodoRequests.checkboxOrStatus({ checkbox: propsValue.billable, status: propsValue.billable_status, field: 'Billable Status' });
    const response = await makeClient(auth.props).startClock(
      clockodoRequests.clockStartBody({
        customers_id: clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer' }),
        projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id, field: 'Project' }),
        services_id: clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service' }),
        text: propsValue.text || undefined,
        billable: billable === undefined ? undefined : billable ? 1 : 0,
      })
    );
    return clockodoRequests.clockEntry({ response, operation: 'start clock' });
  },
});
