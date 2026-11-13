import { createAction } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';

export const getCurrentUserAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Account Info',
  description: 'Get the connected PDFMonkey account, its plan and how many documents it can still generate.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the connected PDFMonkey account: name, email, plan, billing interval and available_documents (documents it can still generate in the current period). Use it before a large batch to check the remaining quota. Read-only.',
    idempotent: true,
  },
  outputSchema: pdfmonkeySchemas.currentUser,
  props: {},
  async run({ auth }) {
    return pdfmonkeyOperations.getCurrentUser({ auth });
  },
});
