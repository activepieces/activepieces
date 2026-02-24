import { createAction, Property } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fa } from 'zod/v4/locales';

export const deleteContact = createAction({
  auth: kudosityAuth,
  name: 'deleteContact',
  displayName: 'Delete Contact',
  description: 'Remove a list member from a Kudosity recipient list',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description:
        'Numeric ID of the recipient list (found in the list page URL).',
      required: false,
    }),
    msisdn: Property.ShortText({
      displayName: 'MSISDN',
      description: 'Phone number with country code (e.g., +1234567890)',
      required: true,
    }),
  },
  async run(context) {
    const payload: any = {
      msisdn: context.propsValue.msisdn,
    };

    if (context.propsValue.listId) {
      payload.list_id = context.propsValue.listId;
    }

    const res = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/delete-from-list.json',
      payload
    );
    return res;
  },
});
