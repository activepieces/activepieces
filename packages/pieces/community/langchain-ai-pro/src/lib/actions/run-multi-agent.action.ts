import { createAction, Property } from "@activepieces/pieces-framework";
import { verifyProLicense } from "../licensing/verify-pro-license";
import { advancedRoute } from "../router/llm-router-pro";
import { VectorMemory } from "../memory/vector-memory";
import { cacheGet, cacheSet } from "../utils/caching";
import { buildTimelineEntry } from "../utils/timeline";

export const runMultiAgent = createAction({
  name: "run_multi_agent",
  displayName: "Run Multi-Agent Orchestrator",
  description:
    "Advanced PRO-only multi-agent system with routing, memory, caching and multi-round reasoning.",

  props: {
    proApiKey: Property.ShortText({
      displayName: "PRO License Key",
      required: true,
    }),

    agents: Property.Json({
      displayName: "Agents Definition",
      description:
        "Example: [{ name: 'researcher', goal: 'collect facts' }, { name: 'writer', goal: 'summaries' }]",
      required: true,
    }),

    query: Property.LongText({
      displayName: "Initial Query",
      required: true,
    }),

    maxRounds: Property.Number({
      displayName: "Max Rounds",
      defaultValue: 4,
      required: false,
    }),

    temperature: Property.Number({
      displayName: "Temperature",
      required: false,
      defaultValue: 0.7,
    }),
  },

  async run(context) {
    const p = context.propsValue;
    const proKey = p.proApiKey;

    // Verify license
    const valid = await verifyProLicense(proKey);
    if (!valid) {
      return {
        error: "Invalid License",
        message: "Your PRO license key is invalid or expired. Get one at https://multiagentpro.ai",
      };
    }

    // Inputs
    const agents = Array.isArray(p.agents) ? p.agents : [];
    if (agents.length < 2)
      throw new Error("You must define at least 2 agents.");

    const query = p.query;
    const maxRounds = p.maxRounds ?? 4;
    const temperature = p.temperature ?? 0.7;

    const memory = new VectorMemory();
    const timeline: any[] = [];

    let state = { text: query };

    // MULTI-AGENT LOOP
    for (let round = 1; round <= maxRounds; round++) {
      for (const agent of agents) {
        const cacheKey = `agent-${agent.name}-${state.text}`;
        const cached = await cacheGet(context, cacheKey);

        let output: string;

        if (cached) {
          output = cached;
        } else {
          const route = advancedRoute(state.text, agent.goal);
          output = await route.llm({
            prompt: `[Agent: ${agent.name}] Goal: ${agent.goal}\n\nInput:\n${state.text}`,
            temperature,
          });
          await cacheSet(context, cacheKey, output);
        }

        memory.addMemory(agent.name, output);

        timeline.push(
          buildTimelineEntry({
            round,
            agent: agent.name,
            output,
          })
        );

        state.text = output;
      }
    }

    return {
      success: true,
      finalOutput: state.text,
      timeline,
      vectorMemory: memory.dump(),
    };
  },
});
