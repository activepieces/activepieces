import { logger } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { generateObject } from 'ai'
import { selectIcon } from './icon-agent'
import { modelService } from '../../services/model.service'
import { CodeAgentResponse, Message, codeGenerationSchema, defaultResponse } from './types'
import { getCodeGenerationPrompt } from './prompts/code-generation.prompt'

export async function generateCode(
    requirement: string,
    projectId: string,
    platformId: string,
    conversationHistory: Message[] = [],
): Promise<CodeAgentResponse | null> {
    try {
        const model = await modelService.getModel(platformId)
        if (!model) {
            logger.warn({ platformId }, '[generateCode] No model available')
            return null
        }

        const lastCodeResponse = conversationHistory
            .reverse()
            .find(msg => 
                msg.role === 'assistant' && 
                msg.content.includes('export const code ='),
            )

        const systemPrompt = getCodeGenerationPrompt(conversationHistory, lastCodeResponse)
        const llmResponse = await generateObject({
            model: model,
            system: systemPrompt,
            schema: codeGenerationSchema,
            prompt: `Generate TypeScript code for this automation flow requirement: ${requirement}`,
            temperature: 0,
        })



        if (isNil(llmResponse?.object)) {
            logger.warn({ platformId, requirement }, '[generateCode] No response from AI model')
            return null
        }

        const resultInputs = llmResponse?.object?.inputs?.reduce((acc, input) => {
            acc[input.name] = input.suggestedValue ?? ''
            return acc
        }, {} as Record<string, string>) ?? {}

        const icon = await selectIcon(requirement, conversationHistory)

        return {
            code: llmResponse.object.code,
            inputs: resultInputs,
            icon: icon ?? undefined,
            title: llmResponse.object.title ?? defaultResponse.title,
        }
    }
    catch (error) {
        logger.error({ error, requirement, platformId }, '[generateCode] Failed to generate code')
        return null
    }
}
