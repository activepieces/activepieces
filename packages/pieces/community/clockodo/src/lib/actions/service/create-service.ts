import { Property, createAction } from '@activepieces/pieces-framework';
import { emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_service',
  displayName: 'Create Service',
  description: 'Creates a service in clockodo',
  audience: 'both',
  aiMetadata: { description: 'Create a new clockodo service (a billable activity type) with a name and optional number, active flag, and note. Not idempotent: each call adds another service even with identical input, so guard against duplicates. To edit an existing service use Update Service.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    number: Property.ShortText({
      displayName: 'Number',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const res = await client.createService({
      name: propsValue.name,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      note: emptyToNull(propsValue.note),
    });
    return res.service;
  },
});
