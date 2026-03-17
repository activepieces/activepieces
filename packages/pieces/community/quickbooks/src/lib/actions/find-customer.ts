import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../..';
import { runQBQuery, QBCustomer } from '../common';

export const quickbooksFindCustomer = createAction({
  auth: quickbooksAuth,
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Searches for customers in QuickBooks by name, email, or company.',
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'Your QuickBooks Company ID.',
      required: true,
    }),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search by display name, company name, or email address.',
      required: true,
    }),
    use_sandbox: Property.Checkbox({
      displayName: 'Use Sandbox',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { realm_id, search_term, use_sandbox } = context.propsValue;

    // QuickBooks SQL-like query supports LIKE with %
    const escaped = search_term.replace(/'/g, "\\'");
    const query = `SELECT * FROM Customer WHERE DisplayName LIKE '%${escaped}%' OR CompanyName LIKE '%${escaped}%' OR PrimaryEmailAddr = '${escaped}' MAXRESULTS 20`;

    const customers = await runQBQuery<QBCustomer>(
      context.auth as any,
      realm_id,
      query,
      use_sandbox ?? false
    );

    return customers;
  },
});
