import { createAction, Property } from "@activepieces/pieces-framework";
import { loadMemory, saveMemory } from "../memory";
import { callOpenAIChat } from "../openai-client";
import { callAnthropicChat } from "../anthropic-client";
import { callGeminiChat } from "../gemini-client";
import { routeProviderAndModel } from "../router";

export const runSingleAgent = createAction({
  name: "run_single_agent",
  displayName: "Run Single-Step Agent",
  description:
    "Execute a single LLM step. For multi-step & multi-agent orchestration → https://multiagentpro.ai",

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
    const temperature = p.temperature;
    const maxTokens = p.maxTokens;

    const apiKeyGeneric = p.apiKey;
    const apiKeyOpenAI = p.openaiApiKey;
    const apiKeyAnthropic = p.anthropicApiKey;
    const apiKeyGemini = p.geminiApiKey;

    const useMemory = p.useMemory;
    const memoryKey = p.memoryKey;

    // PRO limit example: temperature > 1.0
    if (typeof temperature === "number" && temperature > 1.0) {
      return {
        error: "Feature Pro",
        message: "Temperature > 1.0 is available only in PRO version.",
        upgradeUrl: "https://multiagentpro.ai",
        currentLimit: 1.0,
      };
    }

    if (!userPrompt || userPrompt.trim() === "") {
      throw new Error("User prompt cannot be empty.");
    }

    // Routing
    let finalProvider = provider;
    let finalModel: string | undefined = modelInput;

    if (provider === "auto") {
      const routing = routeProviderAndModel({
        userPrompt,
        systemPrompt,
        contextJson: p.contextJson,
      });
      finalProvider = routing.provider;
      finalModel = routing.model;
    }

    // Default models
    if (!finalModel) {
      if (finalProvider === "openai") finalModel = "gpt-4o-mini";
      else if (finalProvider === "anthropic")
        finalModel = "claude-3-5-sonnet-20240620";
      else if (finalProvider === "gemini")
        finalModel = "gemini-1.5-flash";
      else finalModel = "gpt-4o-mini";
    }

    const finalModelSafe = finalModel;

    // API key selection
    let apiKey: string | undefined = undefined;

    if (finalProvider === "openai") apiKey = apiKeyOpenAI || apiKeyGeneric;
    else if (finalProvider === "anthropic")
      apiKey = apiKeyAnthropic || apiKeyGeneric;
    else if (finalProvider === "gemini") apiKey = apiKeyGemini || apiKeyGeneric;
    else apiKey = apiKeyGeneric;

    if (!apiKey) {
      throw new Error(`Missing API key for provider ${finalProvider}`);
    }

    // Memory
    const messages: { role: "system" | "user" | "assistant"; content: string }[] =
      [];

    if (useMemory) {
      if (!memoryKey)
        throw new Error("Memory key is required when memory is enabled.");
      const mem = await loadMemory(context, memoryKey);
      if (mem?.messages) messages.push(...mem.messages);
    }

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: userPrompt });

    let response: { output: string; usage: any } | null = null;

    if (finalProvider === "openai") {
      response = await callOpenAIChat({
        apiKey,
        model: finalModelSafe,
        messages,
        temperature,
        maxTokens,
      });
    } else if (finalProvider === "anthropic") {
      response = await callAnthropicChat({
        apiKey,
        model: finalModelSafe,
        messages,
        temperature,
        maxTokens,
      });
    } else if (finalProvider === "gemini") {
      response = await callGeminiChat({
        apiKey,
        model: finalModelSafe,
        messages,
        temperature,
        maxTokens,
      });
    }

    if (!response) {
      throw new Error("LLM returned no response.");
    }

    messages.push({ role: "assistant", content: response.output });

    if (useMemory && memoryKey) {
      await saveMemory(context, memoryKey, { messages });
    }

    return {
      success: true,
      provider: finalProvider,
      model: finalModelSafe,
      output: response.output,
      usage: response.usage,
      memory: useMemory ? messages : undefined,
    };
  },
});
