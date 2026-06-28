import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const renameList = createAction({
  auth: trelloAuth,
  name: 'rename_list',
  displayName: 'Rename List (Agent)',
  description: 'Rename a Trello list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames a Trello list identified by list_id. Obtain list_id from List Lists. Setting the same name again converges to the same list, so it is idempotent.',
    idempotent: true,
  },
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list. Obtain it from List Lists.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}lists/${context.propsValue['list_id']}/name`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: context.propsValue['name'],
        }),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'List not found. Verify the list_id (resolve it via List Lists).'
      );
    }
  },
});
