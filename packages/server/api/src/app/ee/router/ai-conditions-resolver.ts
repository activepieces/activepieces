import { LanguageModelV2 } from '@ai-sdk/provider'
import { type Schema as AiSchema, generateObject } from 'ai'
import { z } from 'zod'

const conditionsSchema = z.object({
    conditions: z.array(z.boolean()),
})

type ConditionsResult = z.infer<typeof conditionsSchema>

export const aiConditionsResolver = {
    async resolve(params: ResolveAIConditionParams): Promise<boolean[]> {
        const { previousStepsResults, prompts, aiModel } = params
        
        const { object: result } = await generateObject({
            model: aiModel,
            schema: conditionsSchema as unknown as AiSchema,
            prompt: `
            You are a helpful assistant that evaluates multiple conditions of a flow.
            
            IMPORTANT: Evaluate each condition independently and separately. Do not let one condition influence the evaluation of another condition.
            
            The conditions to evaluate are:
            ${prompts.map((prompt, index) => `Condition ${index + 1}: ${prompt}`).join('\n')}
            
            The previous steps results are:
            ${Object.entries(previousStepsResults).map(([key, value]) => `Step ${key}: ${JSON.stringify(value)}`).join('\n')}
            
            Instructions:
            - Evaluate each condition independently based only on the previous steps results
            - Do not consider other conditions when evaluating each individual condition
            - Return an array of boolean values in the exact same order as the conditions listed above
            - Each boolean should represent whether that specific condition is true or false
            `,
        })
        return (result as ConditionsResult).conditions
    },
}

export type ResolveAIConditionParams = {
    previousStepsResults: Record<string, unknown>
    prompts: string[]
    aiModel: LanguageModelV2
}
