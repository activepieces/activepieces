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
import { listCardActivityActionOutputSchema } from '../../output-schemas';

export const listCardActivity = createAction({
  auth: trelloAuth,
  name: 'list_card_activity',
  classification: 'SEARCH',
  displayName: 'List Card Activity (Agent)',
  description: "Read a card's activity history.",
  audience: 'ai',
  outputSchema: listCardActivityActionOutputSchema,
  aiMetadata: {
    description:
      'Reads the activity history of a card: when it was created, moved between lists, and who changed it. Use it to answer questions about how a card got to its current state; use List Card Comments for the discussion on a card, which this action leaves out by default. Results are newest first and paginated 50 at a time, so pass an increasing Page to reach older entries. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    filter: Property.StaticDropdown({
      displayName: 'Activity Type',
      description:
        'Which kind of activity to return. Defaults to card updates such as moves between lists.',
      required: false,
      defaultValue: 'updateCard',
      options: {
        options: [
          { label: 'Card updates (moves, renames)', value: 'updateCard' },
          { label: 'Card created', value: 'createCard' },
          { label: 'Comments', value: 'commentCard' },
          { label: 'All activity', value: 'all' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description:
        'Zero-based page of 50 entries, up to 19. Omit for the most recent page.',
      required: false,
    }),
  },

  async run(context) {
    const page = context.propsValue['page'];
    if (page !== undefined && (!Number.isInteger(page) || page < 0 || page > 19)) {
      throw new Error('Page must be a whole number between 0 and 19.');
    }

    const params: QueryParams = {
      filter: context.propsValue['filter'] ?? 'updateCard',
      limit: '50',
    };
    if (page !== undefined) {
      params['page'] = String(page);
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/actions`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const activity = response.body ?? [];
      return { activity, count: activity.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
