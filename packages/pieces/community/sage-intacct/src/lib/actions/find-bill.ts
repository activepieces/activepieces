import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

type BillRecord = {
  key: string;
  id: string;
  billNumber: string | null;
  referenceNumber: string | null;
  state: string;
  createdDate: string;
  dueDate: string;
  totalTxnAmount: number | null;
  totalTxnAmountDue: number | null;
};

export const findBillAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_bill',
  classification: 'SEARCH',
  displayName: 'Find Bill',
  description: 'Searches for AP bills in Sage Intacct by bill number, vendor ID, or state.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Intacct AP bills by exact bill number, exact vendor ID, or workflow state. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'filters',
      display: 'builder',
      label: 'Filters',
      icon: 'filter',
      props: ['billNumber', 'vendorId', 'state'],
    },
    {
      key: 'footer',
      display: 'footer',
      props: ['maxResults'],
    },
  ],
  props: {
    billNumber: Property.ShortText({
      displayName: 'Bill Number',
      description: 'Filter by exact bill number, e.g. "Bill-001-06".',
      required: false,
      icon: 'tag',
    }),
    vendorId: Property.ShortText({
      displayName: 'Vendor ID',
      description: 'Filter by exact vendor ID, e.g. "VEND-00010".',
      required: false,
      icon: 'user',
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      icon: 'filter',
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Submitted', value: 'submitted' },
          { label: 'Posted', value: 'posted' },
          { label: 'Paid', value: 'paid' },
          { label: 'Partially Paid', value: 'partiallyPaid' },
          { label: 'Declined', value: 'declined' },
          { label: 'Reversed', value: 'reversed' },
        ],
      },
    }),
    maxResults: Property.Number({
      displayName: 'Max results',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 200,
    }),
  },
  async run(context) {
    const { billNumber, vendorId, state, maxResults } = context.propsValue;
    const filters: IntacctFilter[] = [];
    if (billNumber) filters.push({ $eq: { billNumber } });
    if (vendorId) filters.push({ $eq: { 'vendor.id': vendorId } });
    if (state) filters.push({ $eq: { state } });

    const { records } = await sageIntacctClient.query<BillRecord>({
      accessToken: context.auth.access_token,
      object: sageIntacctClient.objects.bill,
      fields: [
        'key',
        'id',
        'billNumber',
        'referenceNumber',
        'state',
        'createdDate',
        'dueDate',
        'totalTxnAmount',
        'totalTxnAmountDue',
      ],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ createdDate: 'desc' }],
      size: maxResults ?? 10,
    });

    return records;
  },
});
