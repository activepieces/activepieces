import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { deleteSubscriber } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';

export const deleteAction = createAction({
  name: 'delete_subscriber',
  auth: sendyAuth,
  displayName: 'Delete Subscriber',
  description: 'Delete a subscriber from a list',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes a subscriber, identified by email, from a specific Sendy list. Use to purge a contact rather than just unsubscribing them. Requires the list and a valid email; deleting an already-absent subscriber has no further effect, so repeating the call is effectively idempotent.', idempotent: true },
  props: {
    list: Property.Dropdown({
      auth: sendyAuth,
      displayName: 'List',
      description: 'Select the list to delete from',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) =>
        await buildListDropdown(auth as SendyAuthType),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The user's email",
      required: true,
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      email: z.string().email(),
    });

    return await deleteSubscriber(context.auth, {
      list_id: context.propsValue.list,
      email: context.propsValue.email,
    });
  },
});
