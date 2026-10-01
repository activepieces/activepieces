import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { customFieldActionOutputSchema } from '../../output-schemas';

export const getCustomField = createAction({
  auth: trelloAuth,
  name: 'get_custom_field',
  classification: 'READ',
  displayName: 'Get Custom Field (Agent)',
  description: 'Read one custom field definition by id.',
  audience: 'ai',
  outputSchema: customFieldActionOutputSchema,
  aiMetadata: {
    description:
      'Reads a single custom field definition, returning its name, type and the board it belongs to. Use it to confirm a field type before writing a value, since Set Card Custom Field Value needs a different body per type. Use List Board Custom Fields when only the board is known. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    custom_field_id: Property.ShortText({
      displayName: 'Custom Field ID',
      description:
        'The ID of the custom field. Obtain it from List Board Custom Fields.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}customFields/${context.propsValue['custom_field_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Custom field not found. Verify the custom_field_id (resolve it via List Board Custom Fields).'
      );
    }
  },
});
