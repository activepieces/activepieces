import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import { deleteSubscriber } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';

export const deleteAction = createAction({
  name: 'delete_subscriber',
  auth: sendyAuth,
  displayName: 'Delete Subscriber',
  description: 'Delete a subscriber from a list',
  props: {
    list: Property.Dropdown({
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
      validators: [Validators.email],
    }),
  },
  async run(context) {
    return await deleteSubscriber(context.auth, {
      list_id: context.propsValue.list,
      email: context.propsValue.email,
    });
  },
});
