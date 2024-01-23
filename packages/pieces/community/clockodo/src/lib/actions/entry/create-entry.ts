import { Property, createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient, reformatDateTime } from '../../common';
import { TimeRecordEntry } from '../../common/models/entry';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'create_entry',
  displayName: 'Create Entry',
  description: 'Creates an entry in clockodo',
  props: {
    customer_id: clockodoCommon.customer_id(),
    project_id: clockodoCommon.project_id(false),
    service_id: clockodoCommon.service_id(),
    time_since: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    time_until: Property.DateTime({
      displayName: 'End Time',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    hourly_rate: Property.Number({
      displayName: 'Hourly Rate',
      required: false,
    }),
    user_id: clockodoCommon.user_id(false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.createEntry({
      customers_id: propsValue.customer_id,
      projects_id: propsValue.project_id,
      services_id: propsValue.service_id,
      time_since: reformatDateTime(propsValue.time_since),
      time_until: reformatDateTime(propsValue.time_until),
      text: propsValue.text,
      hourly_rate: propsValue.hourly_rate,
      users_id: propsValue.user_id,
    } as TimeRecordEntry); // For now we only support time records
    return res.entry;
  },
});
