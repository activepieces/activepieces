import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxAuth } from '../common/auth';
import { useinboxClient } from '../common/client';
import { useinboxProps } from '../common/props';

type CreateListResult = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    id?: string;
    listName?: string;
    groupId?: string;
    legislation?: number;
    createTime?: string;
    updateTime?: string;
    totalContacts?: number;
  };
};

export const createContactListAction = createAction({
  auth: useinboxAuth,
  name: 'create_contact_list',
  displayName: 'Create Contact List',
  description: 'Creates a new contact list in INBOX where you can later add contacts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new, empty contact list in INBOX that contacts can later be added to. Use when a list does not yet exist and one is needed before enrolling contacts; optionally nest it under a group and tag it with a consent legislation basis (GDPR, CASL, CAN-SPAM, or none). Requires a list name. Not idempotent: each call creates a separate list even if the name matches an existing one.',
    idempotent: false,
  },
  props: {
    listName: Property.ShortText({
      displayName: 'List Name',
      description: 'Name of the new contact list (e.g. "Newsletter Subscribers").',
      required: true,
    }),
    groupId: useinboxProps.groupDropdown({
      description:
        'Optional. Place the list inside this group to keep things organised. Leave empty to keep it ungrouped.',
    }),
    legislation: Property.StaticDropdown({
      displayName: 'Legislation',
      description:
        'Legal basis for collecting these contacts. Pick the regulation your audience is covered by; this affects what consent text INBOX shows.',
      required: false,
      defaultValue: 0,
      options: {
        options: [
          { label: 'None', value: 0 },
          { label: 'GDPR (EU)', value: 1 },
          { label: 'CASL (Canada)', value: 2 },
          { label: 'CAN-SPAM (US)', value: 3 },
        ],
      },
    }),
  },
  async run(context) {
    const { listName, groupId, legislation } = context.propsValue;
    const token = await useinboxClient.fetchAccessToken({
      email: context.auth.username,
      password: context.auth.password,
    });

    const response = await useinboxClient.inboxApiCall<CreateListResult>({
      token,
      service: 'inbox',
      method: HttpMethod.POST,
      path: '/contactlists',
      body: {
        listName,
        ...(groupId ? { groupId } : {}),
        legislation: legislation ?? 0,
      },
    });

    const list = response.body?.resultObject ?? {};
    return {
      success: response.body?.resultStatus ?? false,
      result_code: response.body?.resultCode ?? null,
      result_message: response.body?.resultMessage ?? null,
      list_id: list.id ?? null,
      list_name: list.listName ?? listName,
      group_id: list.groupId ?? groupId ?? null,
      legislation: list.legislation ?? legislation ?? 0,
      total_contacts: list.totalContacts ?? 0,
      created_at: list.createTime ?? null,
      updated_at: list.updateTime ?? null,
    };
  },
});
