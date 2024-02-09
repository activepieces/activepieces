import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient, reformatDateTime } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'update_entry',
  displayName: 'Update Entry',
  description: 'Updates an entry in clockodo',
  props: {
    entry_id: Property.Number({
      displayName: 'Entry ID',
      required: true,
    }),
    customer_id: clockodoCommon.customer_id(false),
    project_id: clockodoCommon.project_id(false),
    service_id: clockodoCommon.service_id(false),
    time_since: Property.DateTime({
      displayName: 'Start Time',
      required: false,
    }),
    time_until: Property.DateTime({
      displayName: 'End Time',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    user_id: clockodoCommon.user_id(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.updateEntry(propsValue.entry_id, {
      customers_id: propsValue.customer_id,
      projects_id: propsValue.project_id,
      services_id: propsValue.service_id,
      users_id: propsValue.user_id,
      text: propsValue.text,
      time_since: reformatDateTime(propsValue.time_since),
      time_until: reformatDateTime(propsValue.time_until),
    });
    return res.entry;
  },
});
