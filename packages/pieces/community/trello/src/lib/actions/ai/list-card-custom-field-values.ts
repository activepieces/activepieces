import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { listCardCustomFieldValuesActionOutputSchema } from '../../output-schemas';

export const listCardCustomFieldValues = createAction({
  auth: trelloAuth,
  name: 'list_card_custom_field_values',
  classification: 'READ',
  displayName: 'List Card Custom Field Values (Agent)',
  description: 'Read the custom field values set on a card.',
  audience: 'ai',
  outputSchema: listCardCustomFieldValuesActionOutputSchema,
  aiMetadata: {
    description:
      'Reads the custom field values set on one card, returning each custom_field_id with its value. Get Card does not include custom fields, so this is the only way to read them. Only fields that have a value on the card come back, so a field missing from the result is unset rather than empty, and dropdown fields return an option id that List Custom Field Options resolves to text. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/customFieldItems`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const custom_field_values = response.body ?? [];
      return { custom_field_values, count: custom_field_values.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
