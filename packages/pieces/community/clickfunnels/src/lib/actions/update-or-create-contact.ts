import { createAction, Property } from '@activepieces/pieces-framework';
import { clickfunnelsAuth } from '../common/constants';
import { multiTagsDropdown, teamsDropdown, workspacesDropdown } from '../common/props';
import { clickfunnelsApiService } from '../common/requests';

export const updateOrCreateContact = createAction({
  auth: clickfunnelsAuth,
  name: 'updateOrCreateContact',
  displayName: 'Update or Create Contact',
  description:
    'Searches for a contact by email and updates it, or creates a new one if not found.',
  props: {
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
    emailAddress: Property.ShortText({
      displayName: 'Email',
      description:
        "The contact's email address. This is used to find and (update/create) the contact.",
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    tagIds: multiTagsDropdown(['auth', 'workspaceId']),
    customAttributes: Property.Object({
      displayName: 'Custom Attributes',
      description: 'A key-value object for custom contact data. Keys that are default properties on the Contact resource or variations of it will result in an error. E.g., first_name, First Name, etc. are not valid inputs.',
      required: false,
    }),
  },
  async run({auth, propsValue}) {
    const payload = {
      contact: {
        email_address: propsValue.emailAddress,
        first_name: propsValue.firstName,
        last_name: propsValue.lastName,
        phone_number: propsValue.phoneNumber,
        tag_ids: propsValue.tagIds,
        custom_attributes: propsValue.customAttributes
      },
    };

    const response = await clickfunnelsApiService.upsertContact(auth, propsValue.workspaceId as string, payload);

    return response
  },
});
