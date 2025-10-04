import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chatDataAuth } from '../../index';
import { chatDataCommon } from '../common';
import { chatbotIdProperty } from '../properties';

export const deleteChatbot = createAction({
  auth: chatDataAuth,
  name: 'delete_chatbot',
  displayName: 'Delete Chatbot',
  description: 'Delete a chatbot and all its associated data (training data, conversations, leads, etc.). This action is irreversible.',
  props: {
    chatbotId: chatbotIdProperty,
    confirmation: Property.Checkbox({
      displayName: 'I understand this action is irreversible',
      description: 'Check this box to confirm you understand that deleting a chatbot will permanently remove all associated data and cannot be undone.',
      required: true,
    }),
  },
  async run(context) {
    const { chatbotId, confirmation } = context.propsValue;
    
    if (!confirmation) {
      throw new Error('You must confirm that you understand this action is irreversible before proceeding.');
    }

    const result = await chatDataCommon.makeRequest({
      apiKey: context.auth,
      method: HttpMethod.DELETE,
      endpoint: `/delete-chatbot/${chatbotId}`,
    });

    return result;
  },
});