import { z } from 'zod'
import { agentToolsName } from '@activepieces/shared'

export const UPDATE_TASK_STATUS_SKILL = `
## Task Completion

**IMPORTANT**: As your FINAL ACTION, you must call the \`${agentToolsName.TASK_COMPLETION_TOOL_NAME}\` tool to indicate if the task is complete or not.
- Call this tool only once you have done everything you can to achieve the user's goal, or if you are unable to continue (e.g., after handling errors appropriately and exhausting alternatives).
- If you do not make this final call, your work will be considered unsuccessful.

**Error Handling Guidelines**:
- Tolerate minor errors: If a tool call fails (e.g., no results from a search, invalid URL), analyze the error, then:
    - Retry with adjusted parameters (e.g., refine query, try alternative URL) up to 2-3 times if it seems recoverable.
    - Switch to an alternative tool or approach.
    - Use reasoning to infer or approximate if partial data is available.
- Know when to stop: If errors persist after retries/alternatives (e.g., critical failure like invalid tool arguments or unrecoverable data absence), or if further attempts won't help the goal, conclude the task and call the completion tool.
    - Examples of stopping: Persistent network issues, query inherently unanswerable, or all avenues exhausted.
    - In the completion tool, explain any unresolved issues clearly.

**Final Response and Completion**:
- Once the goal is achieved or unachievable, summarize findings clearly in a final response if needed, then call the \`${agentToolsName.TASK_COMPLETION_TOOL_NAME}\` tool as your last action.
- Do not call the completion tool prematurely—ensure all reasonable steps are taken.
`

export function createUpdateTaskStatusTool() {
    return {
        [agentToolsName.TASK_COMPLETION_TOOL_NAME]: {
            description: `Mark the current task as completed or failed. Call this as your FINAL ACTION after you have done everything possible to achieve the user's goal. Provide a clear summary of what was accomplished or why the task could not be completed.`,
            inputSchema: updateTaskStatusInputSchema,
            outputSchema: updateTaskStatusOutputSchema,
            async execute(input: z.infer<typeof updateTaskStatusInputSchema>) {
                return {
                    status: input.status,
                    summary: input.summary,
                    message: input.status === 'completed' 
                        ? 'Task marked as completed successfully.' 
                        : 'Task marked as failed.',
                }
            },
        },
    }
}

const updateTaskStatusInputSchema = z.object({
    status: z.enum(['completed', 'failed']).describe('Whether the task was completed successfully or failed'),
    summary: z.string().describe('A clear summary of what was accomplished or why the task could not be completed'),
})

const updateTaskStatusOutputSchema = z.object({
    status: z.enum(['completed', 'failed']).describe('The final status of the task'),
    summary: z.string().describe('Summary of the task outcome'),
    message: z.string().describe('Confirmation message'),
})
