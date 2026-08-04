import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const archiveAllCardsInList = createAction({
  auth: trelloAuth,
  name: 'archive_all_cards_in_list',
  displayName: 'Archive All Cards In List (Agent)',
  description: 'Archive every card in a Trello list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives every card in a Trello list identified by list_id (recoverable bulk archive). Obtain list_id from List Lists. This is a bulk mutation, so it is not idempotent.',
    idempotent: false,
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
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}lists/${context.propsValue['list_id']}/archiveAllCards`,
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
