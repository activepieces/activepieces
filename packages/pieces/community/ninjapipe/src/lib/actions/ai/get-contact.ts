import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiGetContact = createAction({
  auth: ninjapipeAuth,
  name: 'ai_get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Gets one contact by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch one NinjaPipe contact by contact_id, with its custom fields (fields object), owner_id and assigned_to. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.contact,
  props: {
    contact_id: ninjapipeAiProps.id({ displayName: 'Contact ID', description: 'NinjaPipe contact UUID, from ai_search_contacts or ai_search_companies.' }),
  },
  async run(context) {
    return ninjapipeClient.getRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/contacts/${ninjapipeClient.pathId({ value: context.propsValue.contact_id, field: 'Contact ID' })}`,
      operation: 'get contact',
    });
  },
});
