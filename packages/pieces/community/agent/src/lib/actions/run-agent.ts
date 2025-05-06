import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Define custom message types
interface BaseMessage {
  role: string;
  content: string;
}

interface SystemMessage extends BaseMessage {
  role: 'system';
}

interface UserMessage extends BaseMessage {
  role: 'user';
}

interface AssistantMessage extends BaseMessage {
  role: 'assistant';
}

interface ToolMessage extends BaseMessage {
  role: 'tool';
  tool_call_id: string;
}

// 1. JSON‐Action schema
const ActionSchema = z.object({
  action: z.string(),               // tool name, "LLM", or "EXIT"
  params: z.record(z.string(), z.any())
});

// 2. System prompt enforcing JSON actions
const DEFAULT_SYSTEM_PROMPT = `
You are an autonomous AI agent designed to help users complete tasks using available tools. 
Every response MUST be exactly one JSON object with the following format:
{"action":"<tool_name>"|"LLM"|"EXIT","params":{...}}

Follow these rules:
1. To call a tool: Use its exact name as the "action" and provide required parameters in "params".
   Example: {"action":"search","params":{"query":"climate change"}}

2. To generate text output directly: Use "LLM" with a "content" parameter.
   Example: {"action":"LLM","params":{"content":"Here's the information you requested..."}}

3. When task is complete: Use "EXIT" to signal completion.
   Example: {"action":"EXIT","params":{"content":"Task completed successfully"}}

4. Error handling: If a tool returns an error, try again with adjusted parameters or use a different approach.

5. For complex tasks: Break them down into steps, using tools to gather necessary information before responding.

6. Always validate inputs: Ensure parameters match what tools expect to avoid errors.

7. Be efficient: Minimize the number of steps to complete a task.

Think carefully about which action is most appropriate for each step of the task.
`;

// 3. Recursive JSON→Zod converter
function jsonSchemaToZod(schema: any): z.ZodTypeAny {
  if (schema.type === 'object' && schema.properties) {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, subschema] of Object.entries(schema.properties)) {
      let field = jsonSchemaToZod(subschema);
      if (!Array.isArray(schema.required) || !schema.required.includes(key)) {
        field = field.optional();
      }
      shape[key] = field;
    }
    return z.object(shape);
  }
  switch (schema.type) {
    case 'string':  return z.string();
    case 'number':  return z.number();
    case 'integer': return z.number().int();
    case 'boolean': return z.boolean();
    case 'array':
      if (schema.items) {
        return Array.isArray(schema.items)
          ? z.tuple(schema.items.map((it: any) => jsonSchemaToZod(it)))
          : z.array(jsonSchemaToZod(schema.items));
      }
      return z.array(z.any());
    default:
      return z.any();
  }
}

// 4. Orchestrator loop
async function orchestrateAgent(options: {
  model: any;
  systemPrompt: string;
  userPrompt: string;
  tools: Record<string, { description: string; parameters: z.ZodTypeAny; execute(args: any): Promise<any> }>;
  maxSteps: number;
}) {
  const { model, systemPrompt, userPrompt, tools, maxSteps } = options;
  
  // Initialize conversation with enhanced context for better task understanding
  const convo: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  // Track task state to prevent loops and guide progress
  let previousActions: string[] = [];
  let repeatActionCount = 0;
  const MAX_REPEAT_ACTIONS = 3;

  for (let step = 1; step <= maxSteps; step++) {
    try {
      // Generate AI response with appropriate settings
      const { text: raw } = await generateText({
        model,
        messages: convo as any,
        tools,
        maxTokens: 512,
        temperature: 0,
        providerOptions: {
          anthropic: {
            thinking: { type: 'enabled', budgetTokens: 12000 },
            sendReasoning: true
          }
        }
      });

      // Parse action with error handling
      let actionObj;
      try {
        // Ensure we have valid JSON
        const trimmedRaw = raw.trim();
        actionObj = ActionSchema.parse(JSON.parse(trimmedRaw));
      } catch (parseError) {
        // Provide helpful context on JSON errors
        const errorAction = raw || '{"invalid":"json"}';
        convo.push({ 
          role: 'assistant', 
          content: errorAction 
        });
        convo.push({ 
          role: 'user', 
          content: 'Error: Please provide a valid JSON response in the format {"action":"tool_name","params":{...}}. Make sure to use double quotes for all keys and string values.'
        });
        continue;
      }

      const { action, params } = actionObj;
      
      // Track action repetition to prevent infinite loops
      if (previousActions.length > 0 && previousActions[previousActions.length - 1] === action) {
        repeatActionCount++;
        if (repeatActionCount >= MAX_REPEAT_ACTIONS) {
          convo.push({ 
            role: 'user', 
            content: `Notice: You've attempted the "${action}" action ${repeatActionCount} times in a row. Consider trying a different approach or tool to make progress on the task.`
          });
          repeatActionCount = 0; // Reset counter after warning
        }
      } else {
        repeatActionCount = 0;
      }
      previousActions.push(action);
      
      // Handle EXIT action - task completion
      if (action === 'EXIT') {
        const assistantMessages = convo
          .filter(m => m.role === 'assistant')
          .map(m => m.content)
          .filter(content => content && content.trim() !== '')
          // Filter out raw JSON responses for cleaner output
          .filter(content => !content.trim().startsWith('{') || !content.trim().endsWith('}'));
        
        // Provide final summary or use existing messages
        const exitContent = params['content'] || '';
        if (exitContent && exitContent.trim() !== '') {
          return exitContent;
        }
        
        return assistantMessages.length > 0 
          ? assistantMessages.join('\n')
          : 'Task completed successfully.';
      }

      // Handle LLM - direct text output
      if (action === 'LLM') {
        const content = params['content'] || 'No content provided';
        convo.push({ role: 'assistant', content });
        continue;
      }

      // Handle tool invocation
      const toolDef = tools[action];
      if (!toolDef) {
        // Provide helpful guidance on available tools
        const availableTools = Object.keys(tools).join(', ');
        convo.push({ 
          role: 'assistant', 
          content: JSON.stringify({ action, params }) || '{"action":"unknown","params":{}}' 
        });
        convo.push({ 
          role: 'user', 
          content: `Error: Unknown action "${action}". Available tools are: ${availableTools}. Please use one of these tools or the "LLM"/"EXIT" actions.` 
        });
        continue;
      }

      // Execute tool with robust error handling
      let result;
      try {
        result = await toolDef.execute(params);
      } catch (err: any) {
        // Provide detailed error feedback for debugging
        const errorMessage = err?.message || 'Unknown error';
        const errorDetails = err?.stack ? `\nDetails: ${err.stack.split('\n')[0]}` : '';
        
        convo.push({ 
          role: 'assistant', 
          content: JSON.stringify({ action, params }) || '{"action":"error","params":{}}' 
        });
        convo.push({ 
          role: 'user', 
          content: `Error using tool "${action}": ${errorMessage}${errorDetails}. Please check parameters and try again.` 
        });
        continue;
      }

      // Process tool result with proper formatting
      let resultContent = 'No result returned';
      if (typeof result === 'string' && result.trim() !== '') {
        resultContent = result;
      } else if (result === null) {
        resultContent = 'Tool returned null';
      } else if (result === undefined) {
        resultContent = 'Tool returned undefined';
      } else if (typeof result === 'object') {
        try {
          resultContent = JSON.stringify(result, null, 2);
        } catch {
          resultContent = 'Tool returned an object that could not be serialized';
        }
      }

      // Add tool result to conversation
      const toolResult = {
        role: 'tool',
        content: resultContent,
        tool_call_id: action
      };
      
      convo.push(toolResult);
    } catch (error: any) {
      // Handle unexpected errors gracefully
      console.error(`Agent orchestration error (step ${step}):`, error);
      convo.push({ 
        role: 'user', 
        content: `An unexpected error occurred. Please continue with a different approach. Error: ${error?.message || 'Unknown error'}`
      });
    }
  }

  // If we reach max steps, provide a summary of progress
  const assistantMessages = convo
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .filter(content => content && content.trim() !== '')
    .filter(content => !content.trim().startsWith('{') || !content.trim().endsWith('}'));
  
  const finalContent = assistantMessages.length > 0 
    ? assistantMessages.join('\n') 
    : 'The agent made progress but did not complete the task within the maximum number of steps.';
  
  return `${finalContent}\n\n(Note: Maximum number of steps (${maxSteps}) reached. Consider increasing maxSteps for complex tasks.)`;
}

// 5. Main runAgent action
export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Run an AI agent with tool access and mixed LLM actions',
  auth: PieceAuth.None(),
  props: {
    apiKey: Property.ShortText({
      displayName: '   API Key',
      description: 'Your Anthropic API key. If not provided, a default key will be used for development',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: "The user's request for the agent",
      required: true,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      description: 'Override the default system prompt',
      required: false,
    }),
    maxSteps: Property.Number({
      displayName: 'Max Steps',
      description: 'Maximum iterations before giving up',
      required: false,
      defaultValue: 10,
    }),
    mcpServerUrl: Property.ShortText({
      displayName: 'MCP Server URL',
      description: 'URL of the MCP server (leave blank for pure LLM)',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.propsValue.apiKey || process.env['ANTHROPIC_API_KEY'];
    const userPrompt = context.propsValue.prompt;
    const systemPrompt = context.propsValue.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const maxSteps = context.propsValue.maxSteps;
    const mcpUrl = context.propsValue.mcpServerUrl;

    // Build Claude model
    const anthropic = createAnthropic({ apiKey });
    const model = anthropic.languageModel('claude-3-7-sonnet-20250219');

    // Discover and register MCP tools
    let tools: Record<string, any> = {};
    if (mcpUrl) {
      const client = new Client({ name: 'agent-mcp', version: '1.0.0' });
      await client.connect(new SSEClientTransport(new URL(mcpUrl)));
      const { tools: mcpTools } = await client.listTools();
      for (const t of mcpTools) {
        if (!t.inputSchema) continue;
        tools[t.name] = tool({
          description: t.description || 'No description provided',
          parameters: jsonSchemaToZod(t.inputSchema),
          execute: async args => {
            const res = await client.callTool({ name: t.name, arguments: args });
            try {
              // Handle the text content case specially
              const content = res && typeof res === 'object' && 'content' in res ? res.content : null;
              if (Array.isArray(content) && content.length > 0) {
                const firstItem = content[0];
                if (firstItem && typeof firstItem === 'object' && 'type' in firstItem && firstItem.type === 'text' && 'text' in firstItem) {
                  return String(firstItem.text);
                }
              }
              // Default case: stringify the response
              return JSON.stringify(res);
            } catch (e) {
              return JSON.stringify(res);
            }
          }
        });
      }
    }

    // Run the orchestrator (handles both tools and LLM actions)
    return await orchestrateAgent({
      model,
      systemPrompt,
      userPrompt,
      tools,
      maxSteps: maxSteps || 10
    });
  },
});
