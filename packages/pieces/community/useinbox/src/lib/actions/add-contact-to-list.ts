import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxAuth } from '../common/auth';
import { useinboxClient } from '../common/client';
import { useinboxProps } from '../common/props';

type ContactResult = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    id?: string;
    email?: string;
    createTime?: string;
    updateTime?: string;
    firstName?: string;
    lastName?: string;
    status?: number;
  };
};

export const addContactToListAction = createAction({
  auth: useinboxAuth,
  name: 'add_contact_to_list',
  displayName: 'Add Contact to List',
  description:
    'Adds a single contact to an INBOX contact list. Creates the contact if the email is new, otherwise updates the existing contact and ensures it is part of the list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a contact (by email) to a specific INBOX contact list, creating the contact if the email is new or updating it if it already exists, and ensuring list membership. Use to subscribe or enroll someone into a list. Requires a target list id and an email address; the upsert is keyed on the email so repeating with the same email and list yields the same membership without creating duplicates.',
    idempotent: true,
  },
  props: {
    listId: useinboxProps.contactListDropdown(),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact to add (e.g. jane@example.com).',
      required: true,
    }),
    //customFields: useinboxProps.customFieldsArray(),
  },
  async run(context) {
    const { listId, email,  } = context.propsValue;
    const token = await useinboxClient.fetchAccessToken({
      email: context.auth.username,
      password: context.auth.password,
    });

    // const formattedCustomFields = Array.isArray(customFields)
    //   ? (customFields as Array<{ customFieldId: string; value: string }>)
    //       .filter((cf) => cf?.customFieldId)
    //       .map((cf) => ({
    //         customFieldId: cf.customFieldId,
    //         value: cf.value,
    //       }))
    //   : [];

    const response = await useinboxClient.inboxApiCall<ContactResult>({
      token,
      service: 'inbox',
      method: HttpMethod.POST,
      path: `/contactlists/${listId}/add`,
      body: {
        email,
        // ...(formattedCustomFields.length > 0 ? { customFields: formattedCustomFields } : {}),
      },
    });

    const contact = response.body?.resultObject ?? {};
    return {
      success: response.body?.resultStatus ?? false,
      result_code: response.body?.resultCode ?? null,
      result_message: response.body?.resultMessage ?? null,
      contact_id: contact.id ?? null,
      email: contact.email ?? email,
      first_name: contact.firstName ?? null,
      last_name: contact.lastName ?? null,
      status: contact.status ?? null,
      created_at: contact.createTime ?? null,
      updated_at: contact.updateTime ?? null,
      list_id: listId,
    };
  },
});
