import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const exportGlobalEmailContactToLinkedAccountAction = createAction({
  auth: podioAuth,
  name: 'podio_export_global_email_contact_to_linked_account',
  displayName: 'Export Global Email Contact to Linked Account',
  description: 'Adds the personal task email-in address to a linked address book.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds the connected user\'s personal Podio task email-in address (the address that creates tasks by email) as a contact in a linked external address book. Needs a linked account with the "addressbook" capability, from Get Linked Accounts. Use Export Object Email Contact for the address of a workspace, app or item.',
    idempotent: false,
  },
  props: {
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked account to export to, from Get Linked Accounts; it must support the "addressbook" capability.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/email/contact/task/export',
      body: { linked_account_id: Number(propsValue.linkedAccountId) },
    });
  },
});
