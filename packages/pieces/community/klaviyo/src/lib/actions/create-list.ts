import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const createListAction = createAction({
  auth: klaviyoAuth,
  name: 'create_list',
  displayName: 'Create List',
  description: 'Create a new list in Klaviyo',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list',
      required: true,
    }),
    optInProcess: Property.StaticDropdown({
      displayName: 'Opt-in Process',
      description: 'The opt-in process for the list',
      required: false,
      options: {
        options: [
          { label: 'Single Opt-in', value: 'single_opt_in' },
          { label: 'Double Opt-in', value: 'double_opt_in' },
        ],
      },
    }),
  },
  async run(context) {
    const { name, optInProcess } = context.propsValue;

    return await klaviyoClient.createList(
      context.auth,
      name,
      optInProcess as string | undefined
    );
  },
});
