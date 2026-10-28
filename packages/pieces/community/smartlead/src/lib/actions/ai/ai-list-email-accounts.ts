import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiListEmailAccountsAction = createAction({
  auth: smartleadAuth,
  name: 'ai_list_email_accounts',
  classification: 'SEARCH',
  displayName: 'List Email Accounts',
  description: 'List the sending email accounts connected to SmartLead.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists sending mailboxes connected to SmartLead with id, from_name, from_email, type, daily limit, sent today and SMTP/IMAP health. Paginated: limit 1-100 (default 100), offset starts at 0; fewer than limit results means the last page. Read-only.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.listEmailAccounts,
  props: {
    offset: Property.Number({ displayName: 'Offset', description: 'Accounts to skip. Default 0.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100. Default 100.', required: false }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.listEmailAccounts({ apiKey: auth.secret_text, offset: propsValue.offset, limit: propsValue.limit });
  },
});
