import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const conversationIdDropdown = Property.Dropdown<string>({
    displayName: 'Conversation',
    description: 'Pick a conversation for context, or leave empty to start a new one.',
    required: false,
    refreshers: ['chatbotId'],
    async options({ auth, propsValue }) {
        const { chatbotId } = propsValue as { chatbotId?: string };

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
    async options({ auth, propsValue }) {
        const { chatbotId } = propsValue as { chatbotId?: string };
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
                `/${chatbotId}/finetunes`
            );

            return {
                disabled: false,
                options: response.map((finetune: any) => ({
                    label: finetune.question || finetune.id,
                    value: finetune.id,
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
