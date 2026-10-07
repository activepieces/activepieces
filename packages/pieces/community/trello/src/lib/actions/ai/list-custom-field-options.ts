import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { listCustomFieldOptionsActionOutputSchema } from '../../output-schemas';

export const listCustomFieldOptions = createAction({
  auth: trelloAuth,
  name: 'list_custom_field_options',
  classification: 'SEARCH',
  displayName: 'List Custom Field Options (Agent)',
  description: 'List the options of a dropdown custom field.',
  audience: 'ai',
  outputSchema: listCustomFieldOptionsActionOutputSchema,
  aiMetadata: {
    description:
      'Lists the selectable options of a dropdown (list) custom field, returning each option id and its text. Use it to resolve the option id that Set Card Custom Field Value requires, because a dropdown field is written by option id rather than by text. Only dropdown fields have options; other field types return an empty list. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    custom_field_id: Property.ShortText({
      displayName: 'Custom Field ID',
      description:
        'The ID of a dropdown custom field. Obtain it from List Board Custom Fields.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}customFields/${context.propsValue['custom_field_id']}/options`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const options = response.body ?? [];
      return { options, count: options.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Custom field not found. Verify the custom_field_id (resolve it via List Board Custom Fields).'
      );
    }
  },
});
