import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieCreateExpenseAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_expense',
  classification: 'WRITE',
  displayName: 'Create Expense',
  description: 'Record an expense, optionally billable to a client.',
  audience: 'human',
  aiMetadata: {
    description:
      'Records a Moxie expense with vendor and client picked from lists. For agents use moxie_expense_create. Not idempotent: each run records another expense.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.expense,
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
    }),
    vendor: moxieDropdowns.stringList({ required: false, displayName: 'Vendor', path: '/action/vendors/list' }),
    clientName: moxieDropdowns.clientName({ required: false, description: 'Client to bill the expense to.' }),
    ...moxieProps.fromSpecs({ specs: moxieFields.expenseCreate, audience: 'human' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createExpense({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
