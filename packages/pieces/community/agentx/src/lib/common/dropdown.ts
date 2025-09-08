import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { AgentXAuth } from "./auth";
import { HttpMethod } from "@activepieces/pieces-common";

export const AgentIdDropdown = Property.Dropdown<string>({
  displayName: "Agent",
  description: "Select an AgentX agent",
  required: true,
  refreshers: [],
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

      if (!Array.isArray(agents)) {
        return {
          disabled: true,
          placeholder: "No agents found",
          options: [],
        };
      }

      return {
        disabled: false,
        options: agents.map((agent: any) => ({
          label: agent.name || `Agent ${agent.id}`,
          value: agent.id,
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
