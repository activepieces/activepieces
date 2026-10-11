import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUpdateExpenseAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_update_expense',
  classification: 'WRITE',
  displayName: 'Update Expense',
  description: 'Update fields on an existing expense.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing Moxie expense by id (amount, tax, category, dates, paid and billable flags, client or project); only the fields you pass change and Clear Fields blanks text fields. The expense id comes from Create Expense (Moxie has no expense search). Idempotent: repeating the same update leaves the expense unchanged.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.expense,
  props: {
    expenseId: Property.ShortText({
      displayName: 'Expense ID',
      description: 'Id of the expense, from Create Expense.',
      required: true,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.expenseUpdate, audience: 'ai' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.expenseUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateExpense({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
