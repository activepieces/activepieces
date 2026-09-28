import { createAction, Property, dateRangeUtils } from '@activepieces/pieces-framework';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { findContactPaymentActionOutputSchema } from '../output-schemas';

export const findContactPaymentAction = createAction({
  auth: sageAccountingAuth,
  name: 'find_contact_payment',
  classification: 'SEARCH',
  displayName: 'Find Contact Payment',
  description: 'Searches for contact payments in Sage Accounting by contact or date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Accounting contact payments by contact or payment date range. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  outputSchema: findContactPaymentActionOutputSchema,
  props: {
    contact: sageAccountingDropdowns.contactFilter,
    bankAccount: sageAccountingDropdowns.bankAccountIdOptional,
    transactionType: sageAccountingDropdowns.transactionTypeIdOptional,
    updatedOrCreatedSince: Property.DateTime({
      displayName: 'Updated or Created Since',
      description: 'Only return payments changed since this date/time.',
      required: false,
    }),
    dateRange: Property.DateRange({
      displayName: 'Payment Date',
      description: 'Only return payments dated within this range.',
      required: false,
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
    const { contact, bankAccount, transactionType, updatedOrCreatedSince, dateRange, maxResults } = context.propsValue;
    const { after, before } = dateRange ? dateRangeUtils.resolve(dateRange) : { after: undefined, before: undefined };

    const { items } = await sageAccountingClient.list<Record<string, unknown>>({
      accessToken: context.auth.access_token,
      path: sageAccountingClient.paths.contactPayments,
      query: {
        ...(contact ? { contact_id: contact } : {}),
        ...(bankAccount ? { bank_account_id: bankAccount } : {}),
        ...(transactionType ? { transaction_type_id: transactionType } : {}),
        ...(updatedOrCreatedSince ? { updated_or_created_since: updatedOrCreatedSince } : {}),
        ...(after ? { from_date: sageAccountingClient.toDate(after) } : {}),
        ...(before ? { to_date: sageAccountingClient.toDate(before) } : {}),
        nested_attributes: 'all',
        items_per_page: String(maxResults ?? 10),
      },
    });

    return items;
  },
});
