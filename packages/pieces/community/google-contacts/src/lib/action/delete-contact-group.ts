import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { deleteContactGroupOutputSchema } from '../output-schemas';

export const googleContactsDeleteContactGroupAction = createAction({
  auth: googleContactsAuth,
  name: 'delete_contact_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact Group',
  description: 'Delete a user-created contact group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one user-created Google Contacts group by its opaque resourceName (contactGroups/{id}). By default only the group is removed and its members stay in the address book; turning on Delete Contacts also permanently deletes every contact in the group, which cannot be undone. Resolve the resourceName with List Contact Groups; Google-managed system groups cannot be deleted. Not idempotent: a repeat call fails because the group is already gone.',
    idempotent: false,
  },
  outputSchema: deleteContactGroupOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact group resource name such as contactGroups/abc123. Resolve it with List Contact Groups.',
      required: true,
    }),
    deleteContacts: Property.Checkbox({
      displayName: 'Also Delete Contacts',
      description:
        'When enabled, every contact in the group is permanently deleted as well. Leave off to remove only the group.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    const deleteContacts = context.propsValue.deleteContacts === true;
    try {
      await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        path: `/${resourceName}`,
        queryParams: { deleteContacts: String(deleteContacts) },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Delete Contact Group',
      });
    }
    return { deleted: true, resourceName, deletedContacts: deleteContacts };
  },
});
