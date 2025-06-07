import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { StructuredToolInterface } from '@langchain/core/tools';
import { ChainValues } from '@langchain/core/dist/utils/types';

type ModelOption = {
  label: string;
  value: string;
  provider: 'openai' | 'anthropic';
};

const supportedAgentModels: ModelOption[] = [
  // Anthropic
  { label: 'Claude 3.7 Sonnet', value: 'claude-3-7-sonnet-latest', provider: 'anthropic' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest', provider: 'anthropic' },
  { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-latest', provider: 'anthropic' },

  // OpenAI
  { label: 'o1', value: 'o1', provider: 'openai' },
  { label: 'GPT-4o', value: 'gpt-4o', provider: 'openai' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini', provider: 'openai' },
  { label: 'GPT-4', value: 'gpt-4', provider: 'openai' },
  { label: 'GPT-4.1', value: 'gpt-4.1', provider: 'openai' },
  { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini', provider: 'openai' },
  { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano', provider: 'openai' },

];

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Run the AI assistant to complete your task.',
  auth: PieceAuth.None(),
  props: {
    model: Property.StaticDropdown<string>({
      displayName: 'Model',
      description: 'Choose which AI model powers the assistant.',
      required: true,
      defaultValue: 'claude-3-7-sonnet-latest',
      options: {
        disabled: false,
        options: supportedAgentModels.map(opt => ({ label: opt.label, value: opt.value })),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
    maxIterations: Property.Number({
      displayName: 'Max Steps',
      description: 'How many steps the assistant can take before stopping.',
      required: true,
      defaultValue: 10,
    }),
    mcpUrls: Property.Array({
      displayName: 'MCP Server URLs',
      description: 'Add MCP server URLs so the AI agent can use its tools.',
      required: false,
      defaultValue: [],
    }),
  },
  async run(context) {
    const serverToken = context.server.token;
    const modelValue = context.propsValue.model;
    const userPrompt = context.propsValue.prompt;
    const maxIterations = context.propsValue.maxIterations;
    const mcpUrls = (context.propsValue.mcpUrls || []) as string[];

    const validMcpUrls = validateMcpUrls(mcpUrls);
    let tools: StructuredToolInterface[] = [];
    let multiClient: MultiServerMCPClient | null = null;

    if (validMcpUrls.length > 0) {
      multiClient = setupMcpClient(validMcpUrls);
      tools = await multiClient.getTools();
      console.log(`Successfully loaded ${tools.length} tools from ${validMcpUrls.length} MCP servers`);
    } else {
      console.log('No MCP server URLs provided, proceeding without MCP tools.');
    }

    const modelInstance = await getChatModelInstance(
      modelValue!,
      supportedAgentModels,
      serverToken,
      context.server.apiUrl
    );

    const agentExecutionResult = await executeAgent(modelInstance, tools, userPrompt, maxIterations);

    if (multiClient) {
      await multiClient.close();
    }

    return normalizeAgentOutputResponse(agentExecutionResult);
  },
});

function normalizeAgentOutputResponse(agentResult: ChainValues | string): Record<string, any> {
  if (typeof agentResult === 'string') {
    return { output: agentResult };
  }

  if (agentResult && typeof agentResult === 'object') {

    if (Object.prototype.hasOwnProperty.call(agentResult, 'output')) {
      const outputValue = agentResult['output'];

      if (typeof outputValue === 'string') {
        return { output: outputValue };
      }

      if (Array.isArray(outputValue) && outputValue.length > 0) {
        const firstItem = outputValue[0];
        if (
          firstItem &&
          typeof firstItem === 'object' &&
          Object.prototype.hasOwnProperty.call(firstItem, 'type') &&
          firstItem.type === 'text' &&
          Object.prototype.hasOwnProperty.call(firstItem, 'text') &&
          typeof firstItem.text === 'string'
        ) {
          return { output: firstItem.text };
        }
      }
    }
  }

  return agentResult;
}

async function getChatModelInstance(
  modelValue: string,
  modelOptions: ModelOption[],
  serverToken: string,
  serverApiUrl: string
): Promise<BaseChatModel> {
  const selectedOption = modelOptions.find(opt => opt.value === modelValue);

  if (!selectedOption) {
    throw new Error(`Model configuration not found for: ${modelValue}`);
  }

  const { provider, value: modelId } = selectedOption;


  switch (provider) {
    case 'anthropic': {
      return new ChatAnthropic({
        model: modelId,
        anthropicApiUrl: `${serverApiUrl}v1/ai-providers/proxy/anthropic`,
        anthropicApiKey: serverToken,
        clientOptions: { defaultHeaders: { Authorization: `Bearer ${serverToken}` } },
        invocationKwargs: {
          thinking: { type: "disabled" }
        }
      });
    }
    case 'openai': {
      return new ChatOpenAI({
        model: modelId,
        openAIApiKey: serverToken,
        configuration: {
          baseURL: `${serverApiUrl}v1/ai-providers/proxy/openai/v1`,
        }
      });
    }
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unsupported LLM provider: ${exhaustiveCheck}`);
    }
  }
}

export async function executeAgent(
  model: BaseChatModel,
  tools: StructuredToolInterface[],
  userPrompt: string,
  maxIterations = 10
): Promise<ChainValues> {

  const currentDate = new Date().toISOString().split('T')[0];

  const systemPrompt = `
  You are an autonomous assistant designed to efficiently achieve the user's single-shot goal using tools. Prioritize accuracy, minimal steps, and user-friendly clarity.
  
  **Today's Date**: ${currentDate}  
  Use this to interpret time-based queries like "this week" or "due tomorrow."
  
  ---
  
  **1. Assumptions**  
  Use sensible defaults (e.g., \`limit = 5\`) only when needed and not provided by the user.
  
  If any assumption could impact correctness, include:  
  **Verification Needed**: [Brief clarification needed from user].
  
  ---
  
  **2. Errors or Missing Data**  
  If a tool fails or gives insufficient data:
  
  - **Self-correct once**, if the mistake is clear and fixable (e.g., typo, invalid param).
  - Otherwise, **ask the user clearly and directly**. When asking for information, if possible, provide brief guidance on where they might find it.  
    Example:  
    "I tried to fetch your Linear tasks, but I need your team ID (e.g., 'team-xyz'). You can usually find this in your Linear workspace settings or URL. Could you provide it?"
  
  Do not guess or fabricate data.
  `;


  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createToolCallingAgent({
    llm: model,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    maxIterations,
    returnIntermediateSteps: true,
    handleParsingErrors: (error: unknown): string => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Agent Error during tool execution/validation:", message);
      if (message.includes("did not match expected schema")) {
        return `Tool Argument Error: The arguments provided were invalid according to the tool's schema. Please check the schema description and try again. Error: ${message}`;
      }
      return `Execution Error: An error occurred trying to process the tool call or format the response: ${message}. Please reassess the situation.`;
    },
  });

  console.log(`Running Tool Calling Agent with input: "${userPrompt}"`);
  try {
    const result = await executor.invoke({
      input: userPrompt,
    });

    console.log(`Agent finished with result:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Agent execution failed with exception:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Agent execution failed unexpectedly: ${errorMessage}` };
  }
}

function validateMcpUrls(mcpUrls: string[]): string[] {
  return mcpUrls
    .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
    .filter(isValidMcpUrl)
}

function isValidMcpUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
function setupMcpClient(validMcpUrls: string[]): MultiServerMCPClient {
  const serverConfig = Object.fromEntries(
    validMcpUrls.map((url, index) => {
      const serverName = `server${index + 1}`;
      return [serverName, {
        transport: "sse" as const,
        url
      }];
    })
  );
  console.trace(`Connecting to ${validMcpUrls.length} MCP servers`);
  return new MultiServerMCPClient(serverConfig);
}
