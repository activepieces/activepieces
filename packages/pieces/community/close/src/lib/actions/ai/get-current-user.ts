import { createAction, OutputSchema } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const ME_FIELDS = ['id', 'email', 'first_name', 'last_name', 'organizations', 'date_created', 'email_accounts'];

const currentUserOutputSchema = {
  fields: [
    ...closeOutputSchemas.fields.user,
    {
      key: 'emailAccounts',
      label: 'Email Accounts',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Email Account ID', description: 'Pass as Sender Account ID when subscribing a contact to a sequence.' },
        { key: 'type', label: 'Type' },
        { key: 'emails', label: 'Sender Emails' },
      ],
    },
  ],
} satisfies OutputSchema;

function emailAccount(raw: unknown) {
  const a = closeMappers.recordOf(raw);
  return {
    id: closeMappers.str(a['id']),
    type: closeMappers.str(a['_type']),
    emails: closeMappers
      .arrayOf(a['identities'])
      .map((i) => closeMappers.str(closeMappers.recordOf(i)['email']))
      .filter((v): v is string => v !== null),
  };
}

export const getCurrentUser = createAction({
  auth: closeAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Get the Close user who owns the API key.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the Close user that owns the connection API key: id (user_...), email, first/last name, organization IDs and the connected email accounts (emailacct_... IDs with their sender emails, needed by Subscribe Contact to Sequence). Never returns API keys or tokens. Read-only.',
    idempotent: true,
  },
  outputSchema: currentUserOutputSchema,
  props: {},
  async run({ auth }) {
    const raw = await closeClient.request({ auth, method: HttpMethod.GET, path: '/me/', query: { _fields: ME_FIELDS } });
    const me = closeMappers.recordOf(raw);
    return {
      ...closeMappers.user(me),
      emailAccounts: closeMappers.arrayOf(me['email_accounts']).map(emailAccount),
    };
  },
});
