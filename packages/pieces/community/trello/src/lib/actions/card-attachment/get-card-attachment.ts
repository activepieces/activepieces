import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { getCardAttachmentActionOutputSchema } from '../../output-schemas';

export const getCardAttachment = createAction({
  auth: trelloAuth,
  name: 'get_card_attachment',
  classification: 'READ',
  displayName: 'Get Card Attachment',
  description: 'Gets a specific attachment on a card.',
  audience: 'both',
  outputSchema: getCardAttachmentActionOutputSchema,
  aiMetadata: { description: 'Retrieves the details of one specific attachment on a Trello card, identified by both card_id and attachment_id. Use to inspect a single attachment when you already know its id (e.g. from Get All Card Attachments). Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    { key: 'attachment', display: 'section', label: 'Attachment', icon: 'paperclip', props: ['card_id', 'attachment_id'] },
  ],
  props: {
    card_id: Property.ShortText({
      description: "From an earlier step, or the code after /c/ in the card's URL.",
      displayName: 'Card ID',
      placeholder: 'aBcD1234',
      required: true,
      width: 'half',
    }),
    attachment_id: Property.ShortText({
      description: 'From Get All Card Attachments or an earlier step.',
      displayName: 'Attachment ID',
      required: true,
      width: 'half',
    })
  },

  async run(context) {

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url:
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments/${context.propsValue['attachment_id']}` +
        `?key=` +
        context.auth.username +
        `&token=` +
        context.auth.password,
      headers: {
        Accept: 'application/json',
      },
    };
    
    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
