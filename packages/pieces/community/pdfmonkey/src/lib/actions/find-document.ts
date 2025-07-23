import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findDocument = createAction({
  auth: pdfmonkeyAuth,
  name: 'findDocument',
  displayName: 'Find Document',
  description: '',
  props: {
    document_card_id: Property.ShortText({
      displayName: 'Document Card ID',
      description: 'The ID of the document card to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { document_card_id } = propsValue;
    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/document_cards/${document_card_id}`
    );
  },
});
