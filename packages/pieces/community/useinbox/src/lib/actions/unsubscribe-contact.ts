import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxAuth } from '../common/auth';
import { useinboxClient } from '../common/client';
import { useinboxProps } from '../common/props';

type StatusChangeResult = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    id?: string;
    email?: string;
    status?: number;
    updateTime?: string;
  };
};

export const unsubscribeContactAction = createAction({
  auth: useinboxAuth,
  name: 'unsubscribe_contact',
  displayName: 'Mark Contact as Unsubscribed',
  description:
    'Changes a contact status to Unsubscribed so they stop receiving campaigns from INBOX. You can also mark them as Hard Bounce or Spam Reported.',
  props: {
    contactId: useinboxProps.contactDropdown(),
    status: Property.StaticDropdown({
      displayName: 'New Status',
      description: 'The status to apply to the contact.',
      required: true,
      defaultValue: 3,
      options: {
        options: [
          { label: 'Unsubscribed', value: 3 },
          { label: 'Hard Bounce', value: 2 },
          { label: 'Spam Reported', value: 4 },
        ],
      },
    }),
  },
  async run(context) {
    const { contactId, status } = context.propsValue;
    const token = await useinboxClient.fetchAccessToken({
      email: context.auth.username,
      password: context.auth.password,
    });

    const response = await useinboxClient.inboxApiCall<StatusChangeResult>({
      token,
      service: 'inbox',
      method: HttpMethod.PATCH,
      path: `/contacts/${contactId}/status`,
      body: { status },
    });

    const contact = response.body?.resultObject ?? {};
    return {
      success: response.body?.resultStatus ?? false,
      result_code: response.body?.resultCode ?? null,
      result_message: response.body?.resultMessage ?? null,
      contact_id: contact.id ?? contactId,
      email: contact.email ?? null,
      status: contact.status ?? status,
      updated_at: contact.updateTime ?? null,
    };
  },
});
