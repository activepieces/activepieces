import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalPilotAuth } from '../../index';
import { makeClient, tagIdProp, listIdProp } from '../common';

export const addTargetAccountAction = createAction({
  auth: digitalPilotAuth,
  name: 'add_target_account',
  displayName: 'Add Target Account',
  description: 'Add a target account to a list',
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
