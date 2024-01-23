import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, emptyToNull, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'update_service',
  displayName: 'Update Service',
  description: 'Updates a service in clockodo',
  props: {
    service_id: clockodoCommon.service_id(true, null),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
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
    const res = await client.updateService(propsValue.service_id as number, {
      name: propsValue.name,
      number: emptyToNull(propsValue.number),
      active: propsValue.active,
      note: emptyToNull(propsValue.note),
    });
    return res.service;
  },
});
