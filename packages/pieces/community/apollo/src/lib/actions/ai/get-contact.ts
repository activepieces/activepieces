import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiGetContactAction = createAction({
  auth: apolloAuth,
  name: 'ai_get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Get one saved contact by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one contact saved in your Apollo CRM by contact ID, including stage, owner, account, list IDs and sequence IDs. A missing or deleted contact fails with Apollo\'s message. Uses no credits.',
    idempotent: true,
  },
  props: {
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Contact ID from Search Contacts or Find Contact by Email (field id).' }),
  },
  outputSchema: apolloOutputSchemas.contact,
  async run({ propsValue, auth }) {
    const contactId = apolloInputs.requireText({ value: propsValue.contact_id, label: 'Contact ID' });
    const body = await apolloRequests.getContact({ apiKey: apiKeyOf(auth), contactId });
    return { contact: apolloMappers.contact(body['contact']) };
  },
});
