import { createAction, Property } from '@activepieces/pieces-framework';

export const chatCompletionAction = createAction({
  name: 'chat-completion',
  displayName: 'Chat Completion',
  description: 'Chat Completion',
  props: {
    question: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
  },
  async run(context) {},
});
