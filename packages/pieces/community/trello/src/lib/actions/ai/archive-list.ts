import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { archiveListActionOutputSchema } from '../../output-schemas';

export const archiveList = createAction({
  auth: trelloAuth,
  name: 'archive_list',
  displayName: 'Archive List (Agent)',
  description: 'Archive or unarchive a Trello list.',
  audience: 'ai',
  outputSchema: archiveListActionOutputSchema,
  aiMetadata: {
    description:
      'Archives (closed=true) or unarchives (closed=false) a Trello list identified by list_id. Obtain list_id from List Lists. Setting the same closed state again converges, so it is idempotent.',
    idempotent: true,
  },
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list. Obtain it from List Lists.',
      required: true,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'True to archive the list, false to unarchive it.',
      required: false,
      defaultValue: true,
    }),
  },

  async run(context) {
    const archived = context.propsValue['archived'] ?? true;
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}lists/${context.propsValue['list_id']}/closed`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: archived ? 'true' : 'false',
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
