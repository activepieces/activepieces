import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { AgentXAuth } from "../common/auth";
import { HttpMethod } from "@activepieces/pieces-common";

export const searchAgents = createAction({
  auth: AgentXAuth,
  name: "search_agents",
  displayName: "Search Agents",
  description: "Find agents by name or ID using search filters.",
  props: {
    name: Property.ShortText({
      displayName: "Agent Name",
      description: "Search by agent name (partial matches allowed).",
      required: false,
    }),
    id: Property.ShortText({
      displayName: "Agent ID",
      description: "Search by exact Agent ID.",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { name, id } = propsValue;

    const agents = await makeRequest(auth, HttpMethod.GET, "/agents");

    if (!Array.isArray(agents)) {
      throw new Error("Unexpected response from AgentX API: expected an array of agents.");
    }

    const filtered = agents.filter((agent: any) => {
      let matches = true;

      if (id) {
        matches = matches && agent._id === id;
      }

      if (name && agent.name) {
        matches = matches && agent.name.toLowerCase().includes(name.toLowerCase());
      }

      return matches;
    });

    return filtered;
  },
});
