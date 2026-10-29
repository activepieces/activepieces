import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieExpenseCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_expense_create',
  classification: 'WRITE',
  displayName: 'Create Expense',
  description: 'Records an expense in Moxie.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records an expense with amount, date, vendor, category and billing flags, optionally billed to a client matched by exact name. Use to sync receipts or bills from another tool; vendor names come from List Vendors. Not idempotent: each call records another expense.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.expense,
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
    }),
    vendor: Property.ShortText({
      displayName: 'Vendor',
      description: 'Vendor name, from List Vendors.',
      required: false,
    }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact client name to bill the expense to, from Search Clients.',
      required: false,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.expenseCreate, audience: 'ai' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createExpense({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
