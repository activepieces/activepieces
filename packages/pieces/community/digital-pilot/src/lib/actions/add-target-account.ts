import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalPilotAuth } from '../auth';
import { makeClient, tagIdProp, listIdProp } from '../common';

export const addTargetAccountAction = createAction({
  auth: digitalPilotAuth,
  name: 'add_target_account',
  displayName: 'Add Target Account',
  description: 'Add a target account to a list',
  audience: 'both',
  aiMetadata: { description: 'Adds a company domain as a target account to a specific DigitalPilot list (identified by tag and list IDs) so its website visits are tracked as high-priority. Use to build or grow an account-based marketing target list. Requires the tag ID, list ID, and the account domain (e.g. example.com); idempotent, since re-adding the same domain leaves the list membership unchanged.', idempotent: true },
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
    await client.addTargetAccount(
      context.propsValue.tagId as string,
      context.propsValue.listId as string,
      context.propsValue.domain
    );
    return {
      success: true,
      message: 'Target account added successfully',
    };
  },
});
