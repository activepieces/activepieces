import { createAction, Property } from "@activepieces/pieces-framework";
import { loadMemory, saveMemory } from "../memory";
import { callOpenAIChat } from "../openai-client";
import { callAnthropicChat } from "../anthropic-client";
import { callGeminiChat } from "../gemini-client";
import { routeProviderAndModel } from "../router";

export const runMultiStepAgent = createAction({
  name: "run_multi_step_agent",
  displayName: "Run Multi-Step Agent",
  description:
    "Multi-step LLM agent with iterative reasoning. FREE edition limited to 8 steps. Upgrade → https://multiagentpro.ai",

  props: {
    provider: Property.StaticDropdown({
      displayName: "Provider",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "Auto (Smart Routing)", value: "auto" },
          { label: "OpenAI", value: "openai" },
          { label: "Anthropic Claude", value: "anthropic" },
          { label: "Google Gemini", value: "gemini" },
        ],
      },
    }),

    model: Property.ShortText({
      displayName: "Model",
      required: false,
    }),

    apiKey: Property.ShortText({
      displayName: "Generic API Key",
      required: false,
    }),

    openaiApiKey: Property.ShortText({
      displayName: "OpenAI API Key",
      required: false,
    }),

    anthropicApiKey: Property.ShortText({
      displayName: "Anthropic API Key",
      required: false,
    }),

    geminiApiKey: Property.ShortText({
      displayName: "Gemini API Key",
      required: false,
    }),

    systemPrompt: Property.LongText({
      displayName: "System Prompt",
      required: false,
    }),

    userPrompt: Property.LongText({
      displayName: "User Prompt",
      required: true,
    }),

    steps: Property.Number({
      displayName: "Max Reasoning Steps",
      required: false,
      defaultValue: 4,
    }),

    contextJson: Property.Json({
      displayName: "Extra Context JSON",
      required: false,
    }),

    useMemory: Property.Checkbox({
      displayName: "Use Memory",
      defaultValue: false,
      required: false,
    }),

    memoryKey: Property.ShortText({
      displayName: "Memory Key",
      required: false,
    }),

    temperature: Property.Number({
      displayName: "Temperature",
      required: false,
    }),

    maxTokens: Property.Number({
      displayName: "Max Tokens",
      required: false,
    }),
  },

  async run(context) {
    const p = context.propsValue;

    const provider = p.provider;
    const modelInput = p.model;
    const systemPrompt = p.systemPrompt;
    const userPrompt = p.userPrompt;
    const maxSteps = p.steps ?? 4;
    const temperature = p.temperature;
    const maxTokens = p.maxTokens;

    const genericApiKey = p.apiKey;
    const openaiApiKey = p.openaiApiKey;
    const anthropicApiKey = p.anthropicApiKey;
    const geminiApiKey = p.geminiApiKey;

    const useMemory = p.useMemory;
    const memoryKey = p.memoryKey;

    if (maxSteps > 8) {
      return {
        error: "Feature Pro",
        message:
          "Multi-step agent is limited to 8 steps in the FREE edition. Upgrade → https://multiagentpro.ai",
        upgradeUrl: "https://multiagentpro.ai",
        currentLimit: 8,
      };
    }

    if (typeof temperature === "number" && temperature > 1.0) {
      return {
        error: "Feature Pro",
        message: "Temperature above 1.0 is PRO-only.",
        upgradeUrl: "https://multiagentpro.ai",
        currentLimit: 1.0,
      };
    }

    if (!userPrompt || userPrompt.trim() === "") {
      throw new Error("User prompt cannot be empty.");
    }

    let effectiveProvider = provider;
    let effectiveModel: string | undefined = modelInput;

    if (provider === "auto") {
      const routing = routeProviderAndModel({
        userPrompt,
        systemPrompt,
        contextJson: p.contextJson,
      });

      effectiveProvider = routing.provider;
      effectiveModel = routing.model;
    }

    if (!effectiveModel) {
      if (effectiveProvider === "openai") effectiveModel = "gpt-4o-mini";
      else if (effectiveProvider === "anthropic")
        effectiveModel = "claude-3-5-sonnet-20240620";
      else if (effectiveProvider === "gemini")
        effectiveModel = "gemini-1.5-flash";
      else effectiveModel = "gpt-4o-mini";
    }

    const finalModel = effectiveModel;

    function resolveApiKey(p: string): string | undefined {
      if (p === "openai") return openaiApiKey || genericApiKey;
      if (p === "anthropic") return anthropicApiKey || genericApiKey;
      if (p === "gemini") return geminiApiKey || genericApiKey;
      return genericApiKey;
    }

    const apiKey = resolveApiKey(effectiveProvider);

    if (!apiKey) {
      throw new Error(`Missing API key for provider: ${effectiveProvider}`);
    }

    const messages: { role: "system" | "user" | "assistant"; content: string }[] =
      [];

    if (useMemory) {
      if (!memoryKey)
        throw new Error("Memory key is required when memory is enabled.");

      const mem = await loadMemory(context, memoryKey);
      if (mem?.messages) {
        mem.messages.forEach((m: any) => {
          if (m.role === "system" || m.role === "user" || m.role === "assistant") {
            messages.push({ role: m.role, content: m.content });
          }
        });
      }
    }

    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });

    messages.push({ role: "user", content: userPrompt });

    const timeline: any[] = [];

    for (let step = 1; step <= maxSteps; step++) {
      let response = null;

      if (effectiveProvider === "openai") {
        response = await callOpenAIChat({
          apiKey,
          model: finalModel,
          messages,
          temperature,
          maxTokens,
        });
      } else if (effectiveProvider === "anthropic") {
        response = await callAnthropicChat({
          apiKey,
          model: finalModel,
          messages,
          temperature,
          maxTokens,
        });
      } else if (effectiveProvider === "gemini") {
        response = await callGeminiChat({
          apiKey,
          model: finalModel,
          messages,
          temperature,
          maxTokens,
        });
      }

      if (!response) {
        throw new Error(`Step ${step}: LLM returned no response.`);
      }

      messages.push({ role: "assistant", content: response.output });

      timeline.push({
        step,
        provider: effectiveProvider,
        model: finalModel,
        output: response.output,
        usage: response.usage,
      });
    }

    if (useMemory && memoryKey) {
      await saveMemory(context, memoryKey, { messages });
    }

    return {
      success: true,
      provider: effectiveProvider,
      model: finalModel,
      steps: maxSteps,
      finalOutput: messages[messages.length - 1]?.content,
      timeline,
      memory: useMemory ? messages : undefined,
    };
  },
});
