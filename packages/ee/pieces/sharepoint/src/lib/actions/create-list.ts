import { microsoftSharePointAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';
import { List } from '@microsoft/microsoft-graph-types';

export const createListAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_list',
  displayName: 'Create List',
  description: 'Creates a new list.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    displayName: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'List Description',
      required: true,
    }),
  },
  async run(context) {
    const { siteId, displayName, description } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const listInput: List = {
      displayName,
      description,
    };

    return await client.api(`/sites/${siteId}/lists`).post(listInput);
  },
});
