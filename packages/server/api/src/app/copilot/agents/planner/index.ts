import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { AskCopilotResponse, isNil } from '@activepieces/shared';
import { plannerUtils } from './planner-utils';
import { WORKFLOW_EXAMPLES } from './tools';
import { z } from 'zod';

const ActionStepSchema = z.object({
    type: z.literal('action'),
    title: z.string(),
    description: z.string()
});

const RouterStepSchema = z.object({
    type: z.literal('router'),
    title: z.string(),
    description: z.string(),
    branches: z.array(z.object({
        condition: z.string(),
        steps: z.array(ActionStepSchema)
    }))
});

const WorkflowSchema = z.object({
    workflow: z.object({
        name: z.string(),
        description: z.string(),
        trigger: z.object({
            title: z.string(),
            description: z.string()
        }),
        steps: z.array(z.union([ActionStepSchema, RouterStepSchema]))
    }),
    errorMessage: z.string().optional()
});

export const plannerAgent = {
    run: async (id: string, prompts: string[]): Promise<AskCopilotResponse> => {
        console.log({ prompts });

        try {
            const { object: result } = await generateObject({
                model: anthropic('claude-3-5-sonnet-20241022', {
                    cacheControl: true,
                }),
                schema: WorkflowSchema,
                schemaName: 'Workflow',
                schemaDescription: 'A workflow automation plan with trigger and steps',
                prompt: `
                You are Activepieces, an expert AI Assistant and exceptional workflow automation builder.

                <system_constraints>
                    - You can only generate workflows, you cannot generate user interfaces
                    - The workflow must start with a trigger event that initiates the automation
                    - Each workflow step should be an independent, reusable function
                    - The workflow steps should be clear and high-level, without implementation details
                    - Focus on describing what each step accomplishes, not how it works internally
                    - The workflow must have single trigger, If the user wants to add multiple triggers, inform them they can't do that.
                    - Keep steps focused and consolidated for the business output - combine data preparation with related actions rather than creating separate steps
                </system_constraints>

                <examples>
                    ${WORKFLOW_EXAMPLES.map(example => `
                        <example>
                            <user_prompt>${example.prompt}</user_prompt>
                            <assistant_response>${JSON.stringify(example.response, null, 4)}</assistant_response>
                        </example>
                    `).join('\n')}
                </examples>

                <user_prompt>
                    ${prompts.join('\n')}
                </user_prompt>
                `
            });

            if (isNil(result.workflow)) {
                return {
                    id,
                    type: 'error',
                    errorMessage: result.errorMessage ?? 'I could not generate the workflow, please try again',
                }
            }

            return {
                id,
                type: 'flow',
                plan: result.workflow,
                operation: plannerUtils.buildWorkflow(result.workflow),
            }
        } catch (error) {
            return {
                id,
                type: 'error',
                errorMessage: 'Failed to generate workflow. Please try again.',
            }
        }
    }
}
