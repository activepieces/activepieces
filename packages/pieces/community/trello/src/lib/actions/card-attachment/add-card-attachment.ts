import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import FormData from "form-data";
import { addCardAttachmentActionOutputSchema } from '../../output-schemas';

export const addCardAttachment = createAction({
  auth: trelloAuth,
  name: 'add_card_attachment',
  classification: 'WRITE',
  displayName: 'Add Card Attachment',
  description: 'Adds an attachment to a card.',
  audience: 'human',
  outputSchema: addCardAttachmentActionOutputSchema,
  propertyGroups: [
    { key: 'card', display: 'section', label: 'Card', icon: 'tag', props: ['card_id'] },
    { key: 'attachment', display: 'section', label: 'Attachment', icon: 'paperclip', props: ['attachment', 'name', 'mime_type', 'set_cover'] },
  ],
  props: {
    card_id: Property.ShortText({
      description: "From an earlier step, or the code after /c/ in the card's URL.",
      displayName: 'Card ID',
      placeholder: 'aBcD1234',
      required: true,
    }),
    attachment: Property.File({
      description: 'A file from an earlier step, or a public URL.',
      displayName: 'File',
      required: true,
    }),
    name: Property.ShortText({
      description: "Shown on the card. Empty uses the file's own name.",
      displayName: 'File Name',
      placeholder: 'report.pdf',
      required: false,
      width: 'half',
    }),
    mime_type: Property.ShortText({
      description: 'The MIME type. Empty lets Trello detect it.',
      displayName: 'File Type',
      placeholder: 'application/pdf',
      required: false,
      width: 'half',
    }),
    set_cover: Property.Checkbox({
      description: 'Only images can be card covers.',
      displayName: 'Set as Cover',
      required: false,
    }),
  },

  async run(context) {
    const attachment = context.propsValue.attachment;
    const qs:QueryParams = {}
    
    const formData = new FormData();

    formData.append('file',attachment.data,{filename:attachment.filename});

    if (context.propsValue['name']) {
      qs['name'] = context.propsValue['name'];
    }
    
    if (context.propsValue['mime_type']) {
      qs['mimeType'] = context.propsValue['mime_type'];
    }
    
    if (context.propsValue['set_cover']) {
      qs['setCover'] = context.propsValue['set_cover'] ?'true':'false';
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url:
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments` +
        `?key=` +
        context.auth.username +
        `&token=` +
        context.auth.password,
      headers: {
        Accept: 'application/json',
        ...formData.getHeaders()
      },
      body:formData,
      queryParams: qs,
    };
    
    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});