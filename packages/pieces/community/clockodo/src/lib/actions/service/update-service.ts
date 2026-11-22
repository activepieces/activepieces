import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'update_service',
  classification: 'WRITE',
  displayName: 'Update Service',
  description: 'Updates a service in Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.service,
  aiMetadata: { description: 'Update an existing Clockodo service identified by its numeric service ID, changing only the fields you supply (name, number, active flag, note). Idempotent: re-sending the same values leaves the service unchanged. Requires a service ID; use Create Service to add a new one.', idempotent: true },
  props: {
    service_id: clockodoCommon.service_id(true, null),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Consulting',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. S-10',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Tick to set to yes. Leaving it unticked changes nothing — use Active Status to set no.',
      required: false,
    }),
    active_status: clockodoCommon.keepYesNo({
      displayName: 'Active Status',
      description: 'Set to Yes or No. Keep or empty leaves it unchanged; overrides the checkbox above.',
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional internal note.',
      placeholder: 'e.g. Agreed by phone',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service' });
    return makeClient(auth.props).updateService({
      id,
      request: clockodoRequests.compact({
        name: propsValue.name || undefined,
        number: emptyToNull(propsValue.number),
        active: clockodoRequests.checkboxOrStatus({ checkbox: propsValue.active, status: propsValue.active_status, field: 'Active Status' }),
        note: emptyToNull(propsValue.note),
      }),
    });
  },
});
