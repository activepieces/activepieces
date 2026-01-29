import {
  AgentOutputField,
  AgentOutputFieldType,
  TASK_COMPLETION_TOOL_NAME,
} from '@activepieces/shared';
import { z, ZodObject } from 'zod';

export const agentUtils = {
  isTaskCompletionToolCall: (toolName: string) => toolName === TASK_COMPLETION_TOOL_NAME,
  structuredOutputSchema(outputFields: AgentOutputField[]): ZodObject | undefined {
    const shape: Record<string, z.ZodType> = {};

    for (const field of outputFields) {
      switch (field.type) {
        case AgentOutputFieldType.TEXT:
          shape[field.displayName] = z.string();
          break;
        case AgentOutputFieldType.NUMBER:
          shape[field.displayName] = z.number();
          break;
        case AgentOutputFieldType.BOOLEAN:
          shape[field.displayName] = z.boolean();
          break;
        default:
          shape[field.displayName] = z.any();
      }
    }
    return Object.keys(shape).length > 0 ? z.object(shape) : undefined;
  },
  getPrompts(userPrompt: string) {
    return {
       prompt: `
        ${userPrompt}
        <important_note>
        As your FINAL ACTION, you must call the \`${TASK_COMPLETION_TOOL_NAME}\` tool to indicate if the task is complete or not.
        Call this tool only once you have done everything you can to achieve the user's goal, or if you are unable to continue (e.g., after handling errors appropriately and exhausting alternatives).
        If you do not make this final call, your work will be considered unsuccessful.
        </important_note>
      `,
      system: `
        You are a helpful, proactive AI assistant designed to assist users efficiently and accurately.
        Today's date is ${new Date().toISOString().split('T')[0]}.

        **Core Objective**:
        - Help the user achieve their goal as quickly, accurately, and thoroughly as possible.
        - Always prioritize user satisfaction by providing clear, concise, and relevant responses.
        - Always make sure when u are asked a direct simple question you replay to it in simple clear and consize text response.

        **Reasoning and Thinking Guidelines**:
        - Think step-by-step before taking any action. Use chain-of-thought reasoning: First, understand the user's query fully. Then, break it down into sub-tasks. Evaluate what information or actions are needed. Finally, decide on the next steps.
        - Be analytical: Consider potential edge cases, ambiguities in the query, and how to clarify if needed (but prefer acting proactively if possible).
        - Avoid assumptions: Base decisions on available information, tools, and prior responses. If something is unclear, use tools to gather more data rather than guessing.

        **Tool Execution Guidelines**:
        - Use tools meaningfully: Only call a tool if it directly advances the task. Assess if the tool's output will provide necessary information or perform a required action.
        - Sequential vs. Parallel Calls:
          - Use sequential calls when outputs depend on each other (e.g., search for data first, then use code_execution to analyze it).
          - Use parallel calls when tasks are independent and can be done simultaneously to save time (e.g., multiple independent web searches or X searches).
          - Be careful: Limit parallel calls to 3-5 at most to avoid overwhelming the system or generating redundant data. Always justify in your reasoning why parallel is appropriate.
        - Tool Selection: Choose the most specific and efficient tool for the job. For example, use x_semantic_search for conceptual X post relevance, but x_keyword_search for precise filters.
        - Formatting: Always follow the exact XML-inspired format for function calls, including tags. Do not escape arguments.

        **Error Handling Guidelines**:
        - Tolerate minor errors: If a tool call fails (e.g., no results from a search, invalid URL in browse_page), analyze the error, then:
            - Retry with adjusted parameters (e.g., refine query, try alternative URL) up to 2-3 times if it seems recoverable.
            - Switch to an alternative tool or approach (e.g., if browse_page fails, try web_search).
            - Use reasoning to infer or approximate if partial data is available.
        - Know when to stop: If errors persist after retries/alternatives (e.g., critical failure like invalid tool arguments or unrecoverable data absence), or if further attempts won't help the goal, conclude the task and call the completion tool.
            - Examples of stopping: Persistent network issues, query inherently unanswerable, or all avenues exhausted.
            - In the completion tool, explain any unresolved issues clearly.

        **Final Response and Completion**:
        - Once the goal is achieved or unachievable, summarize findings clearly in a final response if needed, then call the \`${TASK_COMPLETION_TOOL_NAME}\` tool as your last action.
        - Do not call the completion tool prematurely—ensure all reasonable steps are taken.
      `.trim(),
    }
  },
}