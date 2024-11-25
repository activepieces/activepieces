import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { status } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const statusAction = createAction({
  name: 'get_subscription_status',
  auth: sendyAuth,
  displayName: 'Get Subscription Status',
  description: 'Get the subscription status of a user',
  props: {
    list: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list to get the status from',
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

    return await status(context.auth, {
      list_id: context.propsValue.list,
      email: context.propsValue.email,
    });
  },
});
