import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { generateObject } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { modelService } from '../../services/model.service'
import { selectIcon } from './icon-agent'
import { getCodeGenerationPrompt } from './prompts/code-generation.prompt'
import { CodeAgentResponse, codeGenerationSchema, defaultResponse, Message } from './types'


export async function generateCode(
    requirement: string,
    platformId: string,
    conversationHistory: Message[] = [],
    log: FastifyBaseLogger,
): Promise<CodeAgentResponse> {
    try {
        const model = await modelService(log).getModel(platformId)
        const lastCodeResponse = conversationHistory.reverse().find((msg) => 
            msg.role === 'assistant' && msg.content.includes('export const code ='),
        )

        const systemPrompt = getCodeGenerationPrompt(conversationHistory, lastCodeResponse)
        const llmResponse = await generateObject({
            model,
            system: systemPrompt,
            schema: codeGenerationSchema,
            prompt: `Generate TypeScript code for this automation flow requirement: ${requirement}`,
            temperature: 0,
        })

        if (isNil(llmResponse?.object)) {
            log.warn({ platformId, requirement }, '[generateCode] No response from AI model')
            throw new Error('Failed to generate code: No response from AI model')
        }

        const resultInputs = llmResponse.object.inputs?.reduce((acc, input) => {
            acc[input.name] = input.suggestedValue ?? ''
            return acc
        }, {} as Record<string, string>) ?? {}

        const icon = await selectIcon(model, requirement, conversationHistory)

        return {
            code: llmResponse.object.code,
            inputs: resultInputs,
            icon: icon ?? undefined,
            title: llmResponse.object.title ?? defaultResponse.title,
        }
    }
    catch (error) {
        log.error({ error, requirement, platformId }, '[generateCode] Failed to generate code')
        if (error instanceof ActivepiecesError && error.message === ErrorCode.COPILOT_FAILED) {
            throw error
        }
        throw new Error(error instanceof Error ? error.message : 'Failed to generate code')
    }
}
