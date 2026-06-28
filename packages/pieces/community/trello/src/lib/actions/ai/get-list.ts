import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const getList = createAction({
  auth: trelloAuth,
  name: 'get_list',
  displayName: 'Get List (Agent)',
  description: 'Get the details of a Trello list by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves the details of a single Trello list by its list_id (name, board, open/closed state). Obtain list_id from List Lists. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list. Obtain it from List Lists.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}lists/${context.propsValue['list_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
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
