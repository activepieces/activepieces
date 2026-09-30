import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsGroup } from '../common/contact-group';
import { updateContactGroupOutputSchema } from '../output-schemas';

export const googleContactsUpdateContactGroupAction = createAction({
  auth: googleContactsAuth,
  name: 'update_contact_group',
  classification: 'WRITE',
  displayName: 'Update Contact Group',
  description: 'Rename an existing user-created contact group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames one user-created Google Contacts group identified by its opaque resourceName (contactGroups/{id}). It reads the group first to resolve the required etag and sends an explicit name-only field mask, so members and other group data are untouched. Resolve the resourceName with List Contact Groups; Google-managed system groups cannot be renamed. Safe to retry: re-applying the same name converges, and a concurrent edit surfaces as a re-read-and-retry error.',
    idempotent: true,
  },
  outputSchema: updateContactGroupOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Resource Name',
      description:
        'Opaque contact group resource name such as contactGroups/abc123. Resolve it with List Contact Groups.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Group Name',
      required: true,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    const name = context.propsValue.name.trim();
    if (name.length === 0) {
      throw new Error('New Group Name must not be empty.');
    }
    const groupFields = googleContactsApi.contactGroupFields.join(',');
    let current: Record<string, unknown>;
    try {
      current = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: `/${resourceName}`,
        queryParams: { groupFields, maxMembers: '0' },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Update Contact Group (reading the group)',
      });
    }
    const etag = googleContactsApi.readString({ source: current, path: ['etag'] });
    if (etag === undefined) {
      throw new Error(
        'Update Contact Group could not read the current etag of the group; re-read the group and retry.'
      );
    }
    try {
      const response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.PUT,
        path: `/${resourceName}`,
        body: {
          contactGroup: { etag, name },
          updateGroupFields: 'name',
          readGroupFields: groupFields,
        },
      });
      return googleContactsGroup.summarizeGroup({ group: response });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Update Contact Group',
      });
    }
  },
});
