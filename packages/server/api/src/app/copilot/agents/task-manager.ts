import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export type IntentResult = {
    intent: 'NEW_WORKFLOW' | 'MODIFY_WORKFLOW';
};

const IntentSchema = z.object({
    intent: z.enum(['NEW_WORKFLOW', 'MODIFY_WORKFLOW'])
});

export const taskManager = {
    determineIntent: async (prompts: string[]): Promise<IntentResult> => {
        try {
            const { object } = await generateObject({
                model: anthropic('claude-3-5-sonnet-20241022', {
                    cacheControl: true,
                }),
                schema: IntentSchema,
                schemaName: 'Intent',
                schemaDescription: 'Determine if the user wants to create a new workflow or modify an existing one',
                prompt: `
                You are a task manager responsible for determining user intent in workflow automation requests.

                <intent_determination_rules>
                    - If the user mentions "add", "change", "modify", "update", "remove" in context of an existing workflow, classify as MODIFY_WORKFLOW
                    - If the user describes a completely new automation scenario, classify as NEW_WORKFLOW
                    - If the user is asking questions about how to do something, classify as NEW_WORKFLOW
                    - If unsure, default to NEW_WORKFLOW
                </intent_determination_rules>

                <user_prompt>
                    ${prompts.join('\n')}
                </user_prompt>
                `
            });

            return object;
        } catch (error) {
            // Default to NEW_WORKFLOW in case of any errors
            return { intent: 'NEW_WORKFLOW' };
        }
    }
}
