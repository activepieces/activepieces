import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetLinkedAccountContactsOutputSchema } from '../../../output-schemas';

export const getLinkedAccountContactsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_linked_account_contacts',
  outputSchema: podioGetLinkedAccountContactsOutputSchema,
  displayName: 'Get Linked Account Contacts',
  description: 'Lists or searches the contacts of a linked external account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists or searches by name the contacts of an external account linked to Podio (such as Google). Needs a linked account with the "contacts" capability; its id comes from Get Linked Accounts.',
    idempotent: true,
  },
  props: {
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked account, from Get Linked Accounts.' }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'Part of a name to search for.' }),
    contactable: podioAiProps.bool({ required: false, displayName: 'Contactable Only', description: '"true" returns only contacts that can be invited or assigned tasks. Defaults to "true".' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of contacts to return. Defaults to 100.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/contact/linked_account/${propsValue.linkedAccountId}`,
      query: podioUtils.query({
        values: {
          name: propsValue.name,
          contactable: podioUtils.toBool({ value: propsValue.contactable }),
          limit: propsValue.limit ?? 100,
          offset: propsValue.offset,
        },
      }),
    });
    return { contacts: body, count: body.length };
  },
});
