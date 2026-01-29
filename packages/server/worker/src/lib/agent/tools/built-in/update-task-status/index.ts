import { z } from 'zod'
import { AgentOutputField, AgentOutputFieldType, agentToolsName } from '@activepieces/shared'

export const UPDATE_TASK_STATUS_SKILL = `
## Task Completion

**IMPORTANT**: As your FINAL ACTION, you must call the \`${agentToolsName.TASK_COMPLETION_TOOL_NAME}\` tool to indicate if the task is complete or not.
- Call this tool only once you have done everything you can to achieve the user's goal, or if you are unable to continue (e.g., after handling errors appropriately and exhausting alternatives).
- If you do not make this final call, your work will be considered unsuccessful.

**Final Response and Completion**:
- Once the goal is achieved or unachievable, summarize findings clearly in a final response if needed, then call the \`${agentToolsName.TASK_COMPLETION_TOOL_NAME}\` tool as your last action.
- Do not call the completion tool prematurely—ensure all reasonable steps are taken.
`

type CreateUpdateTaskStatusToolParams = {
    structuredOutput?: AgentOutputField[]
}

export function createUpdateTaskStatusTool({ structuredOutput }: CreateUpdateTaskStatusToolParams = {}) {
    const inputSchema = buildInputSchema(structuredOutput)
    
    return {
        [agentToolsName.TASK_COMPLETION_TOOL_NAME]: {
            description: `Mark the current task as completed or failed. Call this as your FINAL ACTION after you have done everything possible to achieve the user's goal. Provide a clear summary of what was accomplished or why the task could not be completed.`,
            inputSchema,
            outputSchema: updateTaskStatusOutputSchema,
            async execute(input: z.infer<typeof inputSchema>) {
                return {
                    status: input['status'],
                    summary: input['summary'],
                    message: input['status'] === 'completed' 
                        ? 'Task marked as completed successfully.' 
                        : 'Task marked as failed.',
                    ...extractStructuredOutput(input, structuredOutput),
                }
            },
        },
    }
}

function buildInputSchema(structuredOutput?: AgentOutputField[]) {
    const baseSchema: Record<string, z.ZodTypeAny> = {
        status: z.enum(['completed', 'failed']).describe('Whether the task was completed successfully or failed'),
        summary: z.string().describe('A clear summary of what was accomplished or why the task could not be completed'),
    }

    if (structuredOutput && structuredOutput.length > 0) {
        for (const field of structuredOutput) {
            const description = field.description || field.displayName
            switch (field.type) {
                case AgentOutputFieldType.TEXT:
                    baseSchema[field.displayName] = z.string().describe(description)
                    break
                case AgentOutputFieldType.NUMBER:
                    baseSchema[field.displayName] = z.number().describe(description)
                    break
                case AgentOutputFieldType.BOOLEAN:
                    baseSchema[field.displayName] = z.boolean().describe(description)
                    break
                default:
                    baseSchema[field.displayName] = z.any().describe(description)
            }
        }
    }

    return z.object(baseSchema)
}

function extractStructuredOutput(input: Record<string, unknown>, structuredOutput?: AgentOutputField[]): Record<string, unknown> {
    if (!structuredOutput || structuredOutput.length === 0) {
        return {}
    }

    const result: Record<string, unknown> = {}
    for (const field of structuredOutput) {
        if (field.displayName in input) {
            result[field.displayName] = input[field.displayName]
        }
    }
    return result
}

const updateTaskStatusOutputSchema = z.object({
    status: z.enum(['completed', 'failed']).describe('The final status of the task'),
    summary: z.string().describe('Summary of the task outcome'),
})
