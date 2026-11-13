import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const getContact = createAction({
  auth: ninjapipeAuth,
  name: 'get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Gets one contact by ID.',
  audience: 'human',
  aiMetadata: { description: 'Fetch a single NinjaPipe contact by ID, including its custom fields. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.contact,
  props: {
    contactId: ninjapipeProps.contactRequired(),
  },
  async run(context) {
    return ninjapipeClient.getRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/contacts/${ninjapipeClient.pathId({ value: context.propsValue.contactId, field: 'Contact' })}`,
      operation: 'get contact',
    });
  },
});
