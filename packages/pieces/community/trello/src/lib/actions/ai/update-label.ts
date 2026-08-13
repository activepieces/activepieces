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
import { updateLabelActionOutputSchema } from '../../output-schemas';

export const updateLabel = createAction({
  auth: trelloAuth,
  name: 'update_label',
  displayName: 'Update Label (Agent)',
  description: 'Rename or recolor a Trello label.',
  audience: 'ai',
  outputSchema: updateLabelActionOutputSchema,
  aiMetadata: {
    description:
      'Renames or recolors an existing Trello label identified by label_id. Obtain label_id from List Board Labels. Only provided fields change; setting the same values again converges to the same label, so it is idempotent.',
    idempotent: true,
  },
  props: {
    label_id: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label. Obtain it from List Board Labels.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'New Color',
      description:
        'New label color (e.g. green, yellow, orange, red, purple, blue, sky, lime, pink, black).',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = {};
    if (context.propsValue['name']) {
      params['name'] = context.propsValue['name'] as string;
    }
    if (context.propsValue['color']) {
      params['color'] = context.propsValue['color'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}labels/${context.propsValue['label_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Label not found. Verify the label_id (resolve it via List Board Labels).'
      );
    }
  },
});
