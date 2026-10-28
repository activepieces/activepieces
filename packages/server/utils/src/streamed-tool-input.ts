import { LanguageModelV4StreamPart, LanguageModelV4StreamResult } from '@ai-sdk/provider'
import { LanguageModel, wrapLanguageModel } from 'ai'

function preserveStreamedToolInput(model: LanguageModel): LanguageModel {
    if (typeof model === 'string') {
        return model
    }
    return wrapLanguageModel({
        model,
        middleware: {
            wrapStream: async ({ doStream }): Promise<LanguageModelV4StreamResult> => {
                const { stream, ...rest } = await doStream()
                return { ...rest, stream: stream.pipeThrough(streamedInputGuard()) }
            },
        },
    })
}

function streamedInputGuard(): TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart> {
    const streamed = new Map<string, string>()
    return new TransformStream({
        transform: (chunk, controller) => {
            if (chunk.type === 'tool-input-delta') {
                streamed.set(chunk.id, `${streamed.get(chunk.id) ?? ''}${chunk.delta}`)
            }
            if (chunk.type !== 'tool-call') {
                controller.enqueue(chunk)
                return
            }
            controller.enqueue(withStreamedInput({ chunk, streamedText: streamed.get(chunk.toolCallId) }))
            streamed.delete(chunk.toolCallId)
        },
    })
}

function withStreamedInput({ chunk, streamedText }: { chunk: ToolCallPart, streamedText: string | undefined }): ToolCallPart {
    const raw = streamedText?.trim()
    return chunk.input.trim() !== EMPTY_INPUT || !raw || raw === EMPTY_INPUT ? chunk : { ...chunk, input: raw }
}

const EMPTY_INPUT = '{}'

type ToolCallPart = Extract<LanguageModelV4StreamPart, { type: 'tool-call' }>

export const streamedToolInput = {
    preserveStreamedToolInput,
    withStreamedInput,
}
