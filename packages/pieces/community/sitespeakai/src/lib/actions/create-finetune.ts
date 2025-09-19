import { createAction, Property } from "@activepieces/pieces-framework";
import { SiteSpeakAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { chatbotIdDropdown } from "../common/dropdown";

export const createFinetune = createAction({
  auth: SiteSpeakAuth,
  name: 'create_finetune',
  displayName: 'Create Finetune',
  description: 'Adds a new fine-tune (question + suggested answer) for the specified chatbot in SiteSpeakAI.',
  props: {
    chatbotId: chatbotIdDropdown,
    question: Property.LongText({
      displayName: 'Question',
      required: true,
      description: 'The question text you want the chatbot to be able to answer.',
    }),
    suggestedAnswer: Property.LongText({
      displayName: 'Suggested Answer',
      required: true,
      description: 'The answer you suggest the chatbot use for that question.',
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      question: propsValue.question,
      suggested_answer: propsValue.suggestedAnswer,
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/${propsValue.chatbotId}/finetunes`,
      body
    );

    return response;
  },
});
