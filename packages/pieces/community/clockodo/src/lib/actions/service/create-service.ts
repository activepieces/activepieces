import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_service',
  classification: 'WRITE',
  displayName: 'Create Service',
  description: 'Creates a service in Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.service,
  aiMetadata: { description: 'Create a new Clockodo service (a billable activity type) with a name and optional number, active flag, and note. Not idempotent: each call adds another service even with identical input, so guard against duplicates. To edit an existing service use Update Service.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name as shown in Clockodo.',
      placeholder: 'e.g. Consulting',
      required: true,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      description: 'Optional reference number of your own.',
      placeholder: 'e.g. S-10',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the record is active. Inactive records are hidden from time tracking.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional internal note.',
      placeholder: 'e.g. Agreed by phone',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return makeClient(auth.props).createService({
      name: propsValue.name,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      note: emptyToNull(propsValue.note),
    });
  },
});
