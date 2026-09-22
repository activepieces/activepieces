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
import { addCardAttachmentFromUrlActionOutputSchema } from '../../output-schemas';

export const addCardAttachmentFromUrl = createAction({
  auth: trelloAuth,
  name: 'add_card_attachment_from_url',
  classification: 'WRITE',
  displayName: 'Add Card Attachment From URL (Agent)',
  description: 'Attach a link to a card by URL.',
  audience: 'ai',
  outputSchema: addCardAttachmentFromUrlActionOutputSchema,
  aiMetadata: {
    description:
      'Attaches a link to a card by URL, optionally naming it and making it the card cover. Use it to attach a document, image or page that is already hosted somewhere; the file-upload variant of this action takes binary content and is meant for people working in the flow builder, not agents. The URL must start with http:// or https://, and Trello stores the link without downloading it, so a private URL stays unreachable to anyone who cannot already open it. Each call adds another attachment, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The link to attach. Must start with http:// or https://.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'Display name for the attachment (max 256 characters). Defaults to the URL.',
      required: false,
    }),
    set_cover: Property.Checkbox({
      displayName: 'Set As Cover',
      description:
        'Use the attachment as the card cover. Only meaningful for images.',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const url = context.propsValue['url'];
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(
        'URL must start with http:// or https:// to be attached to a Trello card.'
      );
    }

    const params: QueryParams = { url };
    if (context.propsValue['name']) {
      params['name'] = context.propsValue['name'];
    }
    if (context.propsValue['set_cover'] === true) {
      params['setCover'] = 'true';
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
