import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, reformatDateTime } from '../../common';
import { BillableType, EntryListFilter } from '../../common/models/entry';
import { clockodoAuth } from '../../../';

function calculateBillable(
  billable?: boolean,
  billed?: boolean
): BillableType | undefined {
  if (billable === undefined && billed === undefined) {
    return undefined;
  } else {
    if (billed) {
      return 2;
    } else {
      return billable ? 1 : 0;
    }
  }
}

export default createAction({
  auth: clockodoAuth,
  name: 'list_entries',
  displayName: 'Get Entries',
  description: 'Fetches entries from clockodo',
  props: {
    time_since: Property.DateTime({
      displayName: 'Start Date',
      required: true,
    }),
    time_until: Property.DateTime({
      displayName: 'End Date',
      required: true,
    }),
    user_id_filter: Property.Number({
      displayName: 'Customer ID Filter',
      description: 'Filter entries by their user',
      required: false,
    }),
    customer_id_filter: Property.Number({
      displayName: 'Customer ID Filter',
      description: 'Filter entries by their customer',
      required: false,
    }),
    project_id_filter: Property.Number({
      displayName: 'Project ID Filter',
      description: 'Filter entries by their project',
      required: false,
    }),
    service_id_filter: Property.Number({
      displayName: 'Service ID Filter',
      description: 'Filter entries by their service',
      required: false,
    }),
    billable_filter: Property.Checkbox({
      displayName: 'Billable',
      description: 'Only show entries that are billable',
      required: false,
    }),
    billed_filter: Property.Checkbox({
      displayName: 'Billed',
      description: 'Only show entries that are already billed',
      required: false,
    }),
    enhanced_list: Property.Checkbox({
      displayName: 'Enhanced List',
      description: 'Retrieves additional information about the entries',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Reads only the specified page',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const filter: EntryListFilter = {
      users_id: propsValue.user_id_filter,
      customers_id: propsValue.customer_id_filter,
      projects_id: propsValue.project_id_filter,
      services_id: propsValue.service_id_filter,
      billable: calculateBillable(
        propsValue.billable_filter,
        propsValue.billed_filter
      ),
    };
    const time_since = reformatDateTime(propsValue.time_since) as string;
    const time_until = reformatDateTime(propsValue.time_until) as string;
    if (propsValue.page !== undefined) {
      const res = await client.listEntries({
        time_since,
        time_until,
        enhanced_list: propsValue.enhanced_list,
        page: propsValue.page,
        filter,
      });
      return {
        pagination: res.paging,
        entries: res.entries,
      };
    } else {
      const entries = await client.listAllEntries(
        time_since,
        time_until,
        filter
      );
      return {
        entries,
      };
    }
  },
});
