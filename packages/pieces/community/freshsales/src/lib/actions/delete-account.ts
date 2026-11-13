import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { deleteOutputSchema } from '../output-schemas';

export const deleteAccount = createAction({
  auth: freshsalesAuth,
  name: 'delete_account',
  displayName: 'Delete Account',
  description: 'Delete an account by its ID',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Freshsales account (sales account) by numeric ID. With Delete Linked Contacts and Deals on, its contacts and deals are deleted too. A second call for the same ID fails with a not-found error. Confirm the ID with Get Account first.',
    idempotent: true,
  },
  outputSchema: deleteOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the account to delete',
      placeholder: '16000123456',
      required: true,
    }),
    delete_associated: Property.Checkbox({
      displayName: 'Delete Linked Contacts and Deals',
      description: 'Also delete the contacts and deals of this account',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({
      value: context.propsValue.account_id,
      field: 'Account ID',
    });
    await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/sales_accounts/${id}`,
      query: context.propsValue.delete_associated
        ? { delete_associated_contacts_deals: 'true' }
        : undefined,
    });
    return { id, deleted: true };
  },
});
