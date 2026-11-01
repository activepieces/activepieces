import { tryCatch } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { generateText, LanguageModel } from 'ai'
import { JobContext } from '../../../types'

async function generateIfFirstTurn({ model, userMessage, previousUiMessages, log, conversationId, abortSignal }: {
    model: LanguageModel
    userMessage: string
    previousUiMessages: unknown[]
    log: JobContext['log']
    conversationId: string
    abortSignal?: AbortSignal
}): Promise<string | undefined> {
    const isFirstTurn = previousUiMessages.length === 1
    if (!isFirstTurn) return undefined

    const { data: generatedTitle } = await tryCatch(async () => {
        const { text } = await generateText({
            model,
            abortSignal,
            telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-title' }),
            system: 'You name conversations. Never answer, refuse or comment on the message. Output only a concise 3-6 word title for it, nothing else.',
            prompt: `<message>\n${userMessage}\n</message>`,
        })
        return finalize(text)
    })

    if (!generatedTitle) {
        log.warn({ conversation: { id: conversationId } }, 'Failed to auto-generate title')
    }
    return generatedTitle ?? undefined
}

function finalize(rawTitle: string): string {
    return rawTitle
        .replace(/[*_`~#]/g, '')
        .replace(/^["']+|["']+$/g, '')
        .trim()
        .slice(0, 100)
}

export const agentTitle = {
    generateIfFirstTurn,
    finalize,
}
