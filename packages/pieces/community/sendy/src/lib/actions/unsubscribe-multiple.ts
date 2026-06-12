import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { unsubscribe } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const unsubscribeMultipleAction = createAction({
  name: 'unsubscribe_multiple',
  auth: sendyAuth,
  displayName: 'Unsubscribe Multiple Lists',
  description: 'Unsubscribe a subscriber from multiple lists',
  audience: 'both',
  aiMetadata: { description: 'Marks the same subscriber, identified by email, as unsubscribed across several Sendy lists in one call, iterating over each selected list while keeping the records. Use to opt a contact out of multiple lists at once; for a single list use Unsubscribe. Requires the lists and a valid email; repeating the call on already-unsubscribed lists has no further effect, so it is idempotent.', idempotent: true },
  props: {
    lists: Property.MultiSelectDropdown({
      auth: sendyAuth,
      displayName: 'Lists',
      description: 'Select the lists to subscribe to',
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

    const returnValues: any[] = [];

    for (const list of context.propsValue.lists) {
      const rc = await unsubscribe(context.auth, {
        list: list,
        email: context.propsValue.email,
      });
      returnValues.push(rc);
    }
    return returnValues;
  },
});
