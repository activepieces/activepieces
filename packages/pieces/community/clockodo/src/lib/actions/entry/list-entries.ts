import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, reformatDateTime } from '../../common';
import { BillableType, EntryListFilter } from '../../common/models/entry';
import { clockodoAuth } from '../../auth';

function calculateBillable({
  billable,
  billed,
}: {
  billable?: boolean | null;
  billed?: boolean | null;
}): BillableType | undefined {
  if ((billable === undefined || billable === null) && (billed === undefined || billed === null)) {
    return undefined;
  }
  if (billed) {
    return BillableType.BILLED;
  }
  return billable ? BillableType.BILLABLE : BillableType.NOT_BILLABLE;
}

function billableFromStatus(status: string | undefined | null): BillableType | undefined | 'unset' {
  if (status === undefined || status === null || status === '') {
    return 'unset';
  }
  if (status === 'all') {
    return undefined;
  }
  const value = BILLABLE_STATUS_CHOICES[status];
  if (value === undefined) {
    throw new Error(`Billable Status must be one of ${Object.keys(BILLABLE_STATUS_CHOICES).join(', ')}, all; got "${status}".`);
  }
  return value;
}

const BILLABLE_STATUS_CHOICES: Record<string, BillableType> = {
  billable: BillableType.BILLABLE,
  not_billable: BillableType.NOT_BILLABLE,
  billed: BillableType.BILLED,
};

export default createAction({
  auth: clockodoAuth,
  name: 'list_entries',
  classification: 'SEARCH',
  displayName: 'Get Entries',
  description: 'Fetches entries from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.entries,
  aiMetadata: {
    description:
      'Fetches Clockodo time-record entries within a required start/end date range, optionally narrowed by user, customer, project, service, and billable status. Prefer billable_status (all, billable, not_billable, billed); it overrides the billable/billed checkboxes, where billable=false alone means only non-billable entries. Use to find or report on entries by time period; supports two modes: leave page empty to retrieve all matching entries across pages, or set a page number to read just that single page. Read-only and idempotent.',
    idempotent: true,
  },
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
      displayName: 'User ID Filter',
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
    billable_status: Property.StaticDropdown<string, false>({
      displayName: 'Billable Status',
      description: 'When set, overrides the Billable and Billed checkboxes. "All" applies no billable filter.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Billable', value: 'billable' },
          { label: 'Not billable', value: 'not_billable' },
          { label: 'Billed', value: 'billed' },
        ],
      },
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
    const client = makeClient(auth.props);
    const filter: EntryListFilter = {
      users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id_filter, field: 'User ID Filter' }),
      customers_id: clockodoRequests.parseOptionalId({ value: propsValue.customer_id_filter, field: 'Customer ID Filter' }),
      projects_id: clockodoRequests.parseOptionalId({ value: propsValue.project_id_filter, field: 'Project ID Filter' }),
      services_id: clockodoRequests.parseOptionalId({ value: propsValue.service_id_filter, field: 'Service ID Filter' }),
      billable: undefined,
    };
    const fromStatus = billableFromStatus(propsValue.billable_status);
    filter.billable =
      fromStatus === 'unset'
        ? calculateBillable({ billable: propsValue.billable_filter, billed: propsValue.billed_filter })
        : fromStatus;
    const time_since = clockodoRequests.requireValue({ value: reformatDateTime(propsValue.time_since), field: 'Start Date' });
    const time_until = clockodoRequests.requireValue({ value: reformatDateTime(propsValue.time_until), field: 'End Date' });
    const enhanced_list = propsValue.enhanced_list ?? undefined;
    if (propsValue.page !== undefined && propsValue.page !== null) {
      const res = await client.listEntries({
        time_since,
        time_until,
        enhanced_list,
        page: propsValue.page,
        filter,
      });
      return {
        ...(res.paging ? { pagination: res.paging } : {}),
        entries: res.items,
      };
    }
    const entries = await client.listAllEntries({
      time_since,
      time_until,
      filter,
      enhanced_list,
    });
    return {
      entries,
    };
  },
});
