import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { unsubscribe } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const unsubscribeAction = createAction({
  name: 'unsubscribe',
  auth: sendyAuth,
  displayName: 'Unsubscribe',
  description: 'Unsubscribe a subscriber from a list',
  audience: 'both',
  aiMetadata: { description: 'Marks a subscriber, identified by email, as unsubscribed from a single Sendy list while keeping the record (unlike Delete Subscriber, which removes it). Use to opt a contact out of one list; for several lists use Unsubscribe Multiple Lists. Requires the list and a valid email; unsubscribing an already-unsubscribed contact has no further effect, so repeating the call is idempotent.', idempotent: true },
  props: {
    list: Property.Dropdown({
      auth: sendyAuth,
      displayName: 'List',
      description: 'Select the list to unsubscribe from',
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

    return await unsubscribe(context.auth, {
      list: context.propsValue.list,
      email: context.propsValue.email,
    });
  },
});
