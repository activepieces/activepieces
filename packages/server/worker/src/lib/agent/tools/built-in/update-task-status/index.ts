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
    structuredOutputSchema?: AgentOutputField[]
}

export function createUpdateTaskStatusTool({ structuredOutputSchema }: CreateUpdateTaskStatusToolParams = {}) {
    const inputSchema = buildInputSchema(structuredOutputSchema)
    
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
                    output: extractStructuredOutput(input, structuredOutputSchema),
                }
            },
        },
    }
}

function buildInputSchema(structuredOutputSchema?: AgentOutputField[]) {
    const baseSchema: Record<string, z.ZodTypeAny> = {
        status: z.enum(['completed', 'failed']).describe('Whether the task was completed successfully or failed'),
        summary: z.string().describe('A clear summary of what was accomplished or why the task could not be completed'),
    }

    if (structuredOutputSchema && structuredOutputSchema.length > 0) {
        const outputFields: Record<string, z.ZodTypeAny> = {}
        for (const field of structuredOutputSchema) {
            const description = field.description || field.displayName
            switch (field.type) {
                case AgentOutputFieldType.TEXT:
                    outputFields[field.displayName] = z.string().describe(description)
                    break
                case AgentOutputFieldType.NUMBER:
                    outputFields[field.displayName] = z.number().describe(description)
                    break
                case AgentOutputFieldType.BOOLEAN:
                    outputFields[field.displayName] = z.boolean().describe(description)
                    break
                default:
                    outputFields[field.displayName] = z.any().describe(description)
            }
        }
        baseSchema['output'] = z.object(outputFields).describe('The structured output fields for the task')
    }

    return z.object(baseSchema)
}

function extractStructuredOutput(input: Record<string, unknown>, structuredOutputSchema?: AgentOutputField[]): Record<string, unknown> {
    if (!structuredOutputSchema || structuredOutputSchema.length === 0) {
        return {}
    }

    const output = input['output'] as Record<string, unknown> | undefined
    if (!output) {
        return {}
    }

    const result: Record<string, unknown> = {}
    for (const field of structuredOutputSchema) {
        if (field.displayName in output) {
            result[field.displayName] = output[field.displayName]
        }
    }
    return result
}

const updateTaskStatusOutputSchema = z.object({
    status: z.enum(['completed', 'failed']).describe('The final status of the task'),
    summary: z.string().describe('Summary of the task outcome'),
})
