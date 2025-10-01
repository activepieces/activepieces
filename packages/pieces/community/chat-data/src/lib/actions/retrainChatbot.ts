import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { RetrainOptions } from '../common/types';

export const retrainChatbot = createAction({
  name: 'retrain_chatbot',
  displayName: 'Retrain Chatbot',
  description: 'Retrain a chatbot with new data',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'ID of the chatbot to retrain',
      required: true,
    }),
    trainingSettings: Property.Object({
      displayName: 'Training Settings',
      description: 'Additional training configuration',
      required: false,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth);
    
    const opts = context.propsValue.trainingSettings 
      ? RetrainOptions.parse({ trainingSettings: context.propsValue.trainingSettings })
      : undefined;

    return await client.retrainChatbot(context.propsValue.chatbotId, opts);
  },
});