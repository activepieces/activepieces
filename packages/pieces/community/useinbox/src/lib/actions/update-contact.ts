import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxAuth } from '../common/auth';
import { useinboxClient } from '../common/client';
import { useinboxProps } from '../common/props';

type UpdateContactResult = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    status?: number;
    tags?: string[];
    createTime?: string;
    updateTime?: string;
  };
};

export const updateContactAction = createAction({
  auth: useinboxAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description:
    'Updates an existing INBOX contact. You can add or replace tags and set custom field values.',
  props: {
    contactId: useinboxProps.contactDropdown(),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Optional. Tags to attach to the contact (e.g. "vip", "newsletter"). Leave empty to keep existing tags.',
      required: false,
    }),
   // customFields: useinboxProps.customFieldsArray(),
  },
  async run(context) {
    const { contactId, tags,  } = context.propsValue;
    const token = await useinboxClient.fetchAccessToken({
      email: context.auth.username,
      password: context.auth.password,
    });

    const body: Record<string, unknown> = {};
    if (Array.isArray(tags) && tags.length > 0) {
      body['tags'] = tags;
    }
    // if (Array.isArray(customFields) && customFields.length > 0) {
    //   const cleaned = (customFields as Array<{ customFieldId: string; value: string }>)
    //     .filter((cf) => cf?.customFieldId)
    //     .map((cf) => ({ customFieldId: cf.customFieldId, value: cf.value }));
    //   if (cleaned.length > 0) {
    //       body['customFields'] = cleaned;
    //     }
    //   }

    const response = await useinboxClient.inboxApiCall<UpdateContactResult>({
      token,
      service: 'inbox',
      method: HttpMethod.POST,
      path: `/contacts/${contactId}`,
      body,
    });

    const contact = response.body?.resultObject ?? {};
    return {
      success: response.body?.resultStatus ?? false,
      result_code: response.body?.resultCode ?? null,
      result_message: response.body?.resultMessage ?? null,
      contact_id: contact.id ?? contactId,
      email: contact.email ?? null,
      first_name: contact.firstName ?? null,
      last_name: contact.lastName ?? null,
      status: contact.status ?? null,
      tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : null,
      created_at: contact.createTime ?? null,
      updated_at: contact.updateTime ?? null,
    };
  },
});
