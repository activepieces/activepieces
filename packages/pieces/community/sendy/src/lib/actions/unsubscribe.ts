import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import { unsubscribe } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';

export const unsubscribeAction = createAction({
  name: 'unsubscribe',
  auth: sendyAuth,
  displayName: 'Unsubscribe',
  description: 'Unsubscribe a subscriber from a list',
  props: {
    list: Property.Dropdown({
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
      validators: [Validators.email],
    }),
  },
  async run(context) {
    return await unsubscribe(context.auth, {
      list: context.propsValue.list,
      email: context.propsValue.email,
    });
  },
});
