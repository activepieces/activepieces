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
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo', provider: 'openai' },
  { label: 'GPT-4', value: 'gpt-4', provider: 'openai' },
  { label: 'GPT-4.1', value: 'gpt-4.1', provider: 'openai' },
  { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini', provider: 'openai' },
  { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano', provider: 'openai' },

];

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Let an AI assistant help you with tasks using tools.',
  auth: PieceAuth.None(),
  props: {
    model: Property.StaticDropdown<string>({
      displayName: 'Model',
      description: 'Select the model to use for the agent.',
      required: true,
      defaultValue: 'claude-3-5-sonnet-latest',
      options: {
        disabled: false,
        options: supportedAgentModels.map(opt => ({ label: opt.label, value: opt.value })),
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: "The user's request for the agent",
      required: true,
    }),
    maxIterations: Property.Number({
      displayName: 'Max Iterations',
      description: 'Maximum agent steps before stopping',
      required: false,
      defaultValue: 10,
    }),
    mcpUrls: Property.Array({
      displayName: 'MCP Server URLs',
      description: 'URLs of MCP servers providing tools',
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    const serverToken = context.server.token;
    const modelValue = context.propsValue.model;
    const userPrompt = context.propsValue.prompt;
    const maxIterations = context.propsValue.maxIterations ?? 10;
    const mcpUrls = (context.propsValue.mcpUrls || []) as string[];

    const validMcpUrls = validateMcpUrls(mcpUrls);
    const multiClient = setupMcpClient(validMcpUrls);
    const tools = await multiClient.getTools();
    console.log(`Successfully loaded ${tools.length} tools from ${validMcpUrls.length} servers`);

    const modelInstance = await getChatModelInstance(
      modelValue!,
      supportedAgentModels,
      serverToken,
      context.server.apiUrl
    );

    const agentExecutionResult = await executeAgent(modelInstance, tools, userPrompt, maxIterations);
    const processedResult = normalizeAgentOutputResponse(agentExecutionResult);

    await multiClient.close();

    if (typeof processedResult === 'string') {
      return { output: processedResult };
    } else {
      // processedResult is ChainValues here
      if (processedResult && processedResult.hasOwnProperty('error') && processedResult['error'] != null) {
        return { error: String(processedResult['error']) };
      }
      // If no error, and not normalized to a string, return the original agent result.
      return processedResult; 
    }
  },
});

function normalizeAgentOutputResponse(agentResult: ChainValues): string | ChainValues {
  if (agentResult && agentResult.hasOwnProperty('output')) {
    const outputValue = agentResult['output'];

    if (typeof outputValue === 'string') {
      return outputValue; // Return the string directly
    }

    if (Array.isArray(outputValue) && outputValue.length > 0) {
      const firstItem = outputValue[0];
      if (
        firstItem &&
        typeof firstItem === 'object' &&
        firstItem.hasOwnProperty('type') &&
        firstItem.type === 'text' &&
        firstItem.hasOwnProperty('text') &&
        typeof firstItem.text === 'string'
      ) {
        return firstItem.text; // Return extracted string directly
      }
    }
  }
  // In all other cases (output not string, not Anthropic array, output missing, or error exists), 
  // return the original agentResult.
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
  const commonHeaders = { Authorization: `Bearer ${serverToken}` };

  switch (provider) {
    case 'anthropic':
      return new ChatAnthropic({
        model: modelId,
        anthropicApiUrl: `${serverApiUrl}v1/ai-providers/proxy/anthropic`,
        anthropicApiKey: serverToken,
        clientOptions: { defaultHeaders: commonHeaders },
        invocationKwargs: {
          thinking: { type: "disabled" }
        }        
      });
    case 'openai':
      return new ChatOpenAI({
        model: modelId,
        openAIApiKey: serverToken, 
        configuration: {
          baseURL: `${serverApiUrl}v1/ai-providers/proxy/openai/v1`,
        }
      });
    default:
      const exhaustiveCheck: never = provider;
      throw new Error(`Unsupported LLM provider: ${exhaustiveCheck}`);
  }
}

export async function executeAgent(
  model: BaseChatModel,
  tools: StructuredToolInterface[],
  userPrompt: string,
  maxIterations: number = 10
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
    // verbose: true,
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
    const validMcpUrls = mcpUrls
      .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
      .map(url => {
        try {
          return new URL(url).toString();
        } catch (e) {
          console.error(`Invalid MCP URL: ${url}`);
          return null;
        }
      })
      .filter((url): url is string => url !== null);
  return validMcpUrls;
}

function setupMcpClient(validMcpUrls: string[]): MultiServerMCPClient {
    const serverConfig: Record<string, { transport: "sse", url: string }> = {};
    validMcpUrls.forEach((url, index) => {
      const serverName = `server${index + 1}`;
      serverConfig[serverName] = {
        transport: "sse",
        url
      };
    });
    console.log(`Connecting to ${validMcpUrls.length} MCP servers`);
  return new MultiServerMCPClient(serverConfig);
}
