import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoPaginatedCall } from '../../common';

export const findListByName = createAction({
  name: 'find_list_by_name',
  auth: klaviyoAuth,
  displayName: 'Find List by Name',
  description: 'Look up a list by name to get its ID.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
  },
  async run(context) {
    const lists = await klaviyoPaginatedCall<{
      id: string;
      attributes: { name: string };
    }>(
      'lists',
      context.auth.secret_text,
      { filter: `equals(name,"${context.propsValue.name}")` }
    );
    return { data: lists };
  },
});
