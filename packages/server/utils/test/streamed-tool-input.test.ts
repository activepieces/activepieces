import { describe, expect, it } from 'vitest'
import { streamedToolInput } from '../src/streamed-tool-input'

const call = (input: string) => ({ type: 'tool-call' as const, toolCallId: 'c1', toolName: 'ap_build_flow', input })

describe('streamedToolInput.withStreamedInput', () => {
    it('puts back the streamed arguments when the provider replaced invalid JSON with {}', () => {
        expect(streamedToolInput.withStreamedInput({ chunk: call('{}'), streamedText: '{"flowName":"x",}' })).toMatchObject({ input: '{"flowName":"x",}' })
    })

    it('leaves real arguments and genuinely empty calls alone', () => {
        expect(streamedToolInput.withStreamedInput({ chunk: call('{"a":1}'), streamedText: '{"a":1}' })).toMatchObject({ input: '{"a":1}' })
        expect(streamedToolInput.withStreamedInput({ chunk: call('{}'), streamedText: '{}' })).toMatchObject({ input: '{}' })
        expect(streamedToolInput.withStreamedInput({ chunk: call('{}'), streamedText: undefined })).toMatchObject({ input: '{}' })
    })
})
