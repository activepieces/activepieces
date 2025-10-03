import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const chatbotIdDropdown = Property.Dropdown({
    displayName: "Chatbot",
    description: "Select the chatbot you want to delete",
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: "Please connect your account first",
            };
        }

        try {

            const response = await makeRequest(auth as string, HttpMethod.GET, "/get-chatbots");

            return {
                disabled: false,
                options: response.map((chatbot: any) => ({
                    label: chatbot.chatbotName,
                    value: chatbot.chatbotId,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error loading chatbots",
            };
        }
    },
});

export const conversationIdDropdown = Property.Dropdown<string>({
    displayName: "Conversation ID",
    description: "Select a conversation from the chatbot",
    required: true,
    refreshers: ["chatbotId"],

    async options({ auth, chatbotId }) {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: "Please connect your account first",
            };
        }

        if (!chatbotId) {
            return {
                disabled: true,
                options: [],
                placeholder: "Please select a Chatbot first",
            };
        }

        try {
            const response = await makeRequest(
                auth as string,
                HttpMethod.GET,
                `/get-conversations/${chatbotId}?start=0&size=50`
            );

            const conversations = response?.conversations || [];

            return {
                disabled: false,
                options: conversations.map((conv: any) => ({
                    label: `ID: ${conv.conversationId} | Source: ${conv.source || "unknown"
                        } | Country: ${conv.userCountry || "N/A"}`,
                    value: conv.conversationId,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error loading conversations",
            };
        }
    },
});