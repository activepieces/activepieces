import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { deleteContactPropertyOutputSchema } from '../output-schemas';

export const deleteContactProperty = createAction({
  name: 'delete_contact_property',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Contact Property',
  outputSchema: deleteContactPropertyOutputSchema,
  description: 'Permanently remove a custom contact field',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a custom contact property, identified by ID. Removing it clears its value from every contact that had it set. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
  props: {
    contact_property_id: resendProps.contactPropertyId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/contact-properties/${propsValue.contact_property_id}` });
  },
});
