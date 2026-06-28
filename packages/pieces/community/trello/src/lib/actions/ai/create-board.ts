import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const createBoard = createAction({
  auth: trelloAuth,
  name: 'create_board',
  displayName: 'Create Board (Agent)',
  description: 'Create a new Trello board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Trello board with a name and optional description, optionally inside a workspace (organization). Returns the new board id. Obtain org_id (if used) from List Boards / Get My Member. Each call creates a distinct board, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Board Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    org_id: Property.ShortText({
      displayName: 'Organization ID',
      description:
        'The workspace (organization) id to create the board in (optional).',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = { name: context.propsValue['name'] };
    if (context.propsValue['description']) {
      params['desc'] = context.propsValue['description'] as string;
    }
    if (context.propsValue['org_id']) {
      params['idOrganization'] = context.propsValue['org_id'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}boards`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Organization not found. Verify the org_id, or omit it to create a personal board.'
      );
    }
  },
});
