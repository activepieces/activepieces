import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { modifyContactGroupMembersOutputSchema } from '../output-schemas';

export const googleContactsModifyContactGroupMembersAction = createAction({
  auth: googleContactsAuth,
  name: 'modify_contact_group_members',
  classification: 'WRITE',
  displayName: 'Add Or Remove Contact Group Members',
  description: 'Add contacts to a contact group or remove them from it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds contacts to a Google Contacts group and removes contacts from it in one call, taking opaque people/{id} resource names resolved with List Contacts or Search Contacts and a contactGroups/{id} group resolved with List Contact Groups. Additions are accepted by user-created groups and by the system groups contactGroups/myContacts and contactGroups/starred only; other system groups accept removals only. Combined additions and removals are capped at 1000, and the response reports contacts that were not found. Safe to retry — re-applying the same membership changes converges.',
    idempotent: true,
  },
  outputSchema: modifyContactGroupMembersOutputSchema,
  props: {
    resourceName: Property.ShortText({
      displayName: 'Contact Group Resource Name',
      description:
        'Opaque contact group resource name such as contactGroups/abc123, contactGroups/myContacts or contactGroups/starred. Resolve it with List Contact Groups.',
      required: true,
    }),
    resourceNamesToAdd: Property.Array({
      displayName: 'Contacts To Add',
      description:
        'Opaque contact resource names such as people/c12345 to add to the group.',
      required: false,
    }),
    resourceNamesToRemove: Property.Array({
      displayName: 'Contacts To Remove',
      description:
        'Opaque contact resource names such as people/c12345 to remove from the group.',
      required: false,
    }),
  },
  async run(context) {
    const resourceName = context.propsValue.resourceName.trim();
    const resourceNamesToAdd = googleContactsApi.toStringList({
      value: context.propsValue.resourceNamesToAdd,
      label: 'Contacts To Add',
    });
    const resourceNamesToRemove = googleContactsApi.toStringList({
      value: context.propsValue.resourceNamesToRemove,
      label: 'Contacts To Remove',
    });
    const total = resourceNamesToAdd.length + resourceNamesToRemove.length;
    if (total === 0) {
      throw new Error(
        'Add Or Remove Contact Group Members needs at least one contact to add or remove.'
      );
    }
    if (total > 1000) {
      throw new Error(
        `Contacts to add and remove are capped at 1000 combined, received ${total}.`
      );
    }
    if (
      resourceNamesToAdd.length > 0 &&
      googleContactsApi.systemGroupsRejectingAdds.includes(resourceName)
    ) {
      throw new Error(
        `The system group ${resourceName} does not accept added members; only contactGroups/myContacts, contactGroups/starred and user-created groups do.`
      );
    }
    let response: Record<string, unknown>;
    try {
      response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.POST,
        path: `/${resourceName}/members:modify`,
        body: { resourceNamesToAdd, resourceNamesToRemove },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Add Or Remove Contact Group Members',
      });
    }
    const notFound = googleContactsApi
      .readArray({ source: response, path: ['notFoundResourceNames'] })
      .filter((value): value is string => typeof value === 'string');
    const notRemovable = googleContactsApi
      .readArray({
        source: response,
        path: ['canNotRemoveLastContactGroupResourceNames'],
      })
      .filter((value): value is string => typeof value === 'string');
    return {
      resourceName,
      added: resourceNamesToAdd.filter((name) => !notFound.includes(name)),
      removed: resourceNamesToRemove.filter(
        (name) => !notFound.includes(name) && !notRemovable.includes(name)
      ),
      notFoundResourceNames: notFound,
      canNotRemoveLastContactGroupResourceNames: notRemovable,
    };
  },
});
