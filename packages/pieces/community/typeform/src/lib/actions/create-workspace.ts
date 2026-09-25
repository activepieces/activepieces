import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { workspaceOutputSchema } from '../output-schemas';

export const createWorkspaceAction = createAction({
  auth: typeformAuth,
  name: 'create_workspace',
  classification: 'WRITE',
  displayName: 'Create Workspace',
  description: 'Creates a new workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a Typeform workspace to group forms. By default it goes in the account the connected user owns; set Account ID (account_id from List Workspaces) to create it in another account the user belongs to. Returns the new workspace with its ID. Each call creates another workspace.',
    idempotent: false,
  },
  outputSchema: workspaceOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'account_id from List Workspaces. Leave empty for your own account.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, accountId } = propsValue;
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.POST,
      path: typeformCommon.isProvided(accountId)
        ? `/accounts/${encodeURIComponent(accountId.trim())}/workspaces`
        : '/workspaces',
      body: { name },
    });
  },
});
