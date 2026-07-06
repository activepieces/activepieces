import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalPilotAuth } from '../auth';
import { makeClient, tagIdProp, listIdProp } from '../common';

export const removeTargetAccountAction = createAction({
  auth: digitalPilotAuth,
  name: 'remove_target_account',
  displayName: 'Remove Target Account',
  description: 'Remove a target account from a list',
  audience: 'both',
  aiMetadata: { description: 'Removes a company domain from a specific DigitalPilot target-account list (identified by tag and list IDs), stopping it from being tracked as a high-priority account. Use to prune an account-based marketing target list. Requires the tag ID, list ID, and the account domain; idempotent, since removing an already-absent domain leaves the list membership unchanged.', idempotent: true },
  props: {
    tagId: tagIdProp,
    listId: listIdProp,
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Account domain name (e.g., example.com)',
      required: true,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth.secret_text);
    await client.removeTargetAccount(
      context.propsValue.tagId as string,
      context.propsValue.listId as string,
      context.propsValue.domain
    );
    return {
      success: true,
      message: 'Target account removed successfully',
    };
  },
});
