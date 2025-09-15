import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { AgentXAuth } from "./auth";
import { HttpMethod } from "@activepieces/pieces-common";

export const AgentIdDropdown = Property.Dropdown<string>({
  displayName: "Agent",
  description: "Select an AgentX agent",
  required: true, // ensures the value is always a string, not undefined
  refreshers: ["auth"],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: "Please connect your AgentX account first",
        options: [],
      };
    }

    try {
      const agents = await makeRequest(auth as string, HttpMethod.GET, "/agents");

      return {
        disabled: false,
        options: agents.map((agent: any) => ({
          label: agent.name || `Agent ${agent.id}`,
          value: agent._id, // must be string
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        placeholder: `Failed to fetch agents: ${error.message || error}`,
        options: [],
      };
    }
  },
});

export const ConversationIdDropdown = Property.Dropdown<string>({
  displayName: "Conversation",
  description: "Select a conversation for the chosen Agent",
  required: false,
  refreshers: ["auth", "agentId"], 
  options: async ({ auth, agentId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: "Please connect your AgentX account first",
        options: [],
      };
    }

    if (!agentId) {
      return {
        disabled: true,
        placeholder: "Select an Agent first",
        options: [],
      };
    }

    try {
      const conversations = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/agents/${agentId}/conversations`
      );

      return {
        disabled: false,
        options: conversations.map((c: any) => ({
          label: c.title || `Conversation ${c._id}`,
          value: c._id,
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        placeholder: `Failed to fetch conversations: ${error.message || error}`,
        options: [],
      };
    }
  },
});
