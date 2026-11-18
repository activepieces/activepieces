import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf, isRecord } from '../common';
import { moxieRequest } from '../common/client';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieGetWorkspaceAccountAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_get_workspace_account',
  classification: 'READ',
  displayName: 'Get Workspace Account',
  description: 'Get the business name, address, tax id and currency of the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the workspace business identity from Moxie: account name, address, tax id and label, and currency (never bank or payment details). Use when another system needs the supplier details printed on invoices. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.account,
  props: {

  },
  async run({ auth }) {
    const credentials = credentialsOf({ auth });
    const account = await moxieRequest<unknown>({ credentials, method: HttpMethod.GET, path: '/api/auth' });
    const accountId = isRecord(account) ? account['accountId'] : undefined;
    if (typeof accountId !== 'number' && typeof accountId !== 'string') {
      throw new Error('Moxie did not return the account id for this API key.');
    }
    return moxieRequest<unknown>({
      credentials,
      method: HttpMethod.GET,
      path: `/action/account/${encodeURIComponent(String(accountId))}`,
    });
  },
});
