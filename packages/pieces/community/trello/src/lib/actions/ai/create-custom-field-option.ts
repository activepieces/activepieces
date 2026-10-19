import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { customFieldOptionActionOutputSchema } from '../../output-schemas';

export const createCustomFieldOption = createAction({
  auth: trelloAuth,
  name: 'create_custom_field_option',
  classification: 'WRITE',
  displayName: 'Create Custom Field Option (Agent)',
  description: 'Add a selectable option to a dropdown custom field.',
  audience: 'ai',
  outputSchema: customFieldOptionActionOutputSchema,
  aiMetadata: {
    description:
      'Adds one selectable option to a dropdown custom field and returns the new option id. A dropdown field created by Create Board Custom Field starts with no options and no card can be given a value until options exist, so call this once per choice. Only dropdown fields accept options. Each call adds another option even if the text repeats, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    custom_field_id: Property.ShortText({
      displayName: 'Custom Field ID',
      description:
        'The ID of a dropdown custom field. Obtain it from List Board Custom Fields.',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Option Text',
      description: 'The text shown for this option.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}customFields/${context.propsValue['custom_field_id']}/options`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        queryParams: withAuthParams(context.auth),
        body: {
          value: { text: context.propsValue['value'] },
          pos: 'bottom',
        },
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Custom field not found. Verify the custom_field_id and that it is a dropdown (list) field.'
      );
    }
  },
});
