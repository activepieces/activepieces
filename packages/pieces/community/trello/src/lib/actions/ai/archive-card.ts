import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { archiveCardActionOutputSchema } from '../../output-schemas';

export const archiveCard = createAction({
  auth: trelloAuth,
  name: 'archive_card',
  displayName: 'Archive Card (Agent)',
  description: 'Archive or unarchive a Trello card.',
  audience: 'ai',
  outputSchema: archiveCardActionOutputSchema,
  aiMetadata: {
    description:
      'Archives (closed=true) or unarchives (closed=false) a Trello card. Archiving is recoverable, so prefer this over Delete Card. Obtain card_id from Search Cards. Setting the same closed state again converges, so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'True to archive the card, false to unarchive it.',
      required: false,
      defaultValue: true,
    }),
  },

  async run(context) {
    const archived = context.propsValue['archived'] ?? true;
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/closed`,
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
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
