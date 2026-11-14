import { createAction, Property } from '@activepieces/pieces-framework';
import { getLists } from '../api';
import { sendyAuth } from '../auth';

export const getListsAction = createAction({
  name: 'get_brand_lists',
  classification: 'SEARCH',
  auth: sendyAuth,
  displayName: 'Get Lists',
  description: "List the email lists of the connection's brand.",
  audience: 'both',
  aiMetadata: { description: 'Retrieves the email lists belonging to the brand configured in the connection, optionally including hidden lists. Use to discover available list IDs before subscribing, unsubscribing, or sending a campaign. Read-only and idempotent.', idempotent: true },
  props: {
    includeHidden: Property.Checkbox({
      displayName: 'Include Hidden Lists',
      description: 'Also return lists hidden in Sendy.',
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
