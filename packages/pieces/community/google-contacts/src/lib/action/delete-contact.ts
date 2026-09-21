import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { deleteContactOutputSchema } from '../output-schemas';

export const googleContactsDeleteContactAction = createAction({
  auth: googleContactsAuth,
  name: 'delete_contact',
  classification: 'WRITE',
  displayName: 'Delete Contact',
  description: 'Permanently delete a contact by its resource name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Google Contacts person by its opaque resourceName (people/{id}). Irreversible — the People API has no trash, so confirm the contact with Get Contact or List Contacts first; use Batch Delete Contacts for many at once. Not idempotent: a repeat call fails because the contact is already gone.',
    idempotent: false,
  },
  outputSchema: deleteContactOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact resource name such as people/c12345. Resolve it with List Contacts or Search Contacts. Deletion cannot be undone.',
      required: true,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    try {
      await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        path: `/${resourceName}:deleteContact`,
      });
    } catch (error) {
      throw googleContactsApi.toApiError({ error, operation: 'Delete Contact' });
    }
    return { deleted: true, resourceName };
  },
});
