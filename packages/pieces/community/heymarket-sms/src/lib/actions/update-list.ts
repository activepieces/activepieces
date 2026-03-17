import { createAction, Property } from '@activepieces/pieces-framework';
import { heymarketSmsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateList = createAction({
  auth: heymarketSmsAuth,
  name: 'updateList',
  displayName: 'Update List',
  description:
    'Update an existing list in your team by adding or removing members, or updating list properties',
  props: {
    list_id: Property.Number({
      displayName: 'List ID',
      description: 'Unique identifier for the list to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'List Name',
      description: 'Updated name for the list',
      required: true,
    }),
    add_phone: Property.ShortText({
      displayName: 'Add Phone',
      description:
        'Phone number in E.164 format without the plus sign to add to the list (e.g. 14155553434)',
      required: false,
    }),
    remove_phone: Property.ShortText({
      displayName: 'Remove Phone',
      description:
        'Phone number in E.164 format without the plus sign to remove from the list (e.g. 14155553434)',
      required: false,
    }),
    members: Property.Json({
      displayName: 'Members',
      description:
        'Object of list targets. Keys are phone numbers, values are objects with optional first name (f) and last name (l)',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, title, add_phone, remove_phone, members } =
      context.propsValue;

    // Build request body
    const body: any = {
      title,
    };

    if (add_phone) body.add_phone = add_phone;
    if (remove_phone) body.remove_phone = remove_phone;
    if (members) body.members = members;
    const apiKey = context.auth.secret_text;

    try {
      const response = await makeRequest(
        apiKey,
        HttpMethod.PUT,
        `/v1/list/${list_id}`,
        body
      );

      return response;
    } catch (error: any) {
      throw new Error(`Failed to update list: ${error.message}`);
    }
  },
});
