import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const conversationIdDropdown = Property.Dropdown<string>({
    displayName: 'Conversation',
    description: 'Pick a conversation for context, or leave empty to start a new one.',
    required: false,
    refreshers: ['chatbotId'],
    async options({ auth, chatbotId }) {
    
        if (!auth || !chatbotId) {
            return {
                disabled: true,
                options: [],
                placeholder: "Select a chatbot first",
            };
        }

        try {
            const response = await makeRequest(
                auth as string,
                HttpMethod.GET,
                `/${chatbotId}/conversations`
            );

            return {
                disabled: false,
                options: response.map((conv: any) => ({
                    label: conv.title || conv.id,
                    value: conv.id,
                })),
            };
        } catch (e: any) {
            return {
                disabled: true,
                options: [],
                placeholder: "Failed to fetch conversations",
            };
        }
    },
});
export const finetuneIdDropdown = Property.Dropdown<string>({
  displayName: 'Finetune Entry',
  description: 'Select the finetune entry to delete.',
  required: true,
  refreshers: ['chatbotId'],
  async options({ auth, chatbotId }) {
    
    console.log("fwyutgfuwgfy")
    console.log(chatbotId)
    if (!auth || !chatbotId) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please enter/select a chatbot ID first",
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/${chatbotId}/finetunes`
      );

      if (!response || response.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: "No finetune entries found for this chatbot",
        };
      }

      return {
        disabled: false,
        options: response.map((item: any) => ({
          label: item.question || item.id,
          value: item.id,
        })),
      };
    } catch (e: any) {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to fetch finetune entries",
      };
    }
  },
});
