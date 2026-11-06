import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetLinkedAccountContactOutputSchema } from '../../../output-schemas';

export const getLinkedAccountContactAction = createAction({
  auth: podioAuth,
  name: 'podio_get_linked_account_contact',
  outputSchema: podioGetLinkedAccountContactOutputSchema,
  displayName: 'Get Linked Account Contact',
  description: 'Gets one contact from a linked external account by its external id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one contact from an external account linked to Podio (such as Google), by the provider\'s contact id. Needs a linked account with the "contacts" capability; its id comes from Get Linked Accounts, and the external contact id from Get Linked Account Contacts.',
    idempotent: true,
  },
  props: {
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked account, from Get Linked Accounts.' }),
    externalContactId: podioAiProps.text({ required: true, displayName: 'External Contact ID', description: 'The provider\'s id of the contact, the external_id from Get Linked Account Contacts.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/contact/linked_account/${propsValue.linkedAccountId}`,
      body: { external_contact_id: propsValue.externalContactId },
    });
  },
});
