import { Property, createAction } from '@activepieces/pieces-framework';
import { emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'create_service',
  displayName: 'Create Service',
  description: 'Creates a service in clockodo',
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
    const client = makeClient(auth);
    const res = await client.createService({
      name: propsValue.name,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      note: emptyToNull(propsValue.note),
    });
    return res.service;
  },
});
