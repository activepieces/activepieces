import { createAction, Property } from '@activepieces/pieces-framework';
import { getLists } from '../api';
import { sendyAuth } from '../auth';

export const getListsAction = createAction({
  name: 'get_brand_lists',
  auth: sendyAuth,
  displayName: 'Get Lists for a Brand',
  description: 'Get the Lists for a Brand',
  props: {
    includeHidden: Property.Checkbox({
      displayName: 'Include Hidden Lists',
      description: 'Include hidden lists in the results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return await getLists(context.auth, {
      include_hidden: context.propsValue.includeHidden ? 'yes' : 'no',
    });
  },
});
