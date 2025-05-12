import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { ChatOpenAI } from "@langchain/openai";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  createToolCallingAgent,
  AgentExecutor,
} from "langchain/agents";
import { StructuredToolInterface } from '@langchain/core/tools';

export async function runAgent(
  model: BaseChatModel,
  tools: StructuredToolInterface[],
  userPrompt: string,
  maxIterations: number = 10
): Promise<string> {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const baseSystemMessageContent = "You are a helpful assistant. Help the user achieve their goals by using the tools given to you.";

  // Fully Generalized Custom Instructions
  const customInstructions =
    `Current date: ${currentDate}.` + // Keep date context concise
    // Focus on the critical distinction: tool failure vs. general knowledge
    ` If a required tool fails or doesn't provide necessary data, report this clearly and state why you cannot complete that part of the task. Do not invent data that was expected from a failed tool.` +
    // High-level instruction for missing general details
    ` For general details needed to complete the task that were not provided by the user or tools, use your common sense and general knowledge to fill them in reasonably and professionally. Avoid leaving obvious gaps or using placeholders.`;

  // Combine base and custom, separated by a newline
  const completeSystemTemplate = baseSystemMessageContent + "\n\n" + customInstructions;

  const finalPrompt = ChatPromptTemplate.fromMessages([
      ["system", completeSystemTemplate],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createToolCallingAgent({
    llm: model,
    tools,
    prompt: finalPrompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    maxIterations,
    verbose: true,
    handleParsingErrors: (error: unknown): string => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Agent Error during tool execution/validation:", message);
        if (message.includes("did not match expected schema") || message.includes("Failed to parse") || message.includes("Tool input validation error")) {
             return `Tool Argument Error: The arguments provided were invalid according to the tool's schema or couldn't be parsed. Please check the requirements and try again. Error details: ${message}`;
        }
        return `Execution Error: An error occurred trying to process the tool call or format the response: ${message}. Please reassess the situation or try a different approach.`;
    },
  });

  const result = await executor.invoke({
    input: userPrompt,
    chat_history: [],
  });

  return result['output'] ?? "Agent finished but produced no final output.";
}

export const OpenAIAgent = createAction({
  name: 'openai_agent',
  displayName: 'OpenAI Agent',
  description: 'Run an AI agent with tool access and mixed LLM actions',
  auth: PieceAuth.None(),
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Select the model to use for the agent.',
      required: true,
      refreshers: [],
      defaultValue: 'gpt-4o-mini',
      options: async () => {
        const modelOptions = [
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'o1', value: 'o1' },
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { label: 'GPT-4', value: 'gpt-4' },
        ];

        return {
          disabled: false,
          options: modelOptions,
        };
      }
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: "The user's request for the agent",
      required: true,
    }),
    maxIterations: Property.Number({
      displayName: 'Max Iterations',
      description: 'Maximum iterations before giving up',
      required: false,
      defaultValue: 10,
    }),
    mcpUrls: Property.Array({
      displayName: 'MCP Server URLs',
      description: 'URLs of MCP servers to connect to',
      required: false,
      defaultValue: [],
    }),
  },
  async run(context) {
    // const apiKey = context.server.token; 
    const apiKey = process.env['OPENAI_API_KEY'];     
    const proxyUrl = `${context.server.apiUrl}v1/ai-providers/proxy/openai`;
    const model = context.propsValue.model || 'gpt-4o';
    const userPrompt = context.propsValue.prompt;
    const maxIterations = context.propsValue.maxIterations;
    const mcpUrls = (context.propsValue.mcpUrls || []) as string[];

    const validMcpUrls = validateMcpUrls(mcpUrls);
    const multiClient = setupMcpClient(validMcpUrls);
    const tools = await multiClient.getTools();
    console.log(`Successfully loaded ${tools.length} tools from ${validMcpUrls.length} servers`);

    const openaiModel = new ChatOpenAI({ model: model });
    const agentResponse = await runAgent(openaiModel, tools, userPrompt, maxIterations);
    
    await multiClient.close();
    
    return agentResponse;
  },
});

function validateMcpUrls(urls: string[]): string[] {
  return urls.filter(url => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      console.warn(`Invalid MCP URL skipped: ${url}`);
      return false;
    }
  });
}

function setupMcpClient(urls: string[]): MultiServerMCPClient {
  const serverConfig: Record<string, { transport: "sse", url: string }> = {};
  urls.forEach((url, index) => {
    const serverName = `server${index + 1}`;
    serverConfig[serverName] = {
      transport: "sse",
      url
    };
  });
  console.log(`Connecting to ${urls.length} MCP servers`);
  return new MultiServerMCPClient(serverConfig);
}
