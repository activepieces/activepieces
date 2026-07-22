import { describe, expect, it } from 'vitest'
import { chatHelpers } from '../../../../src/app/ee/chat/chat-helpers'
import { chatMemoryAi } from '../../../../src/app/ee/chat/chat-memory-ai'

describe('chatHelpers.capMemories', () => {
    it('caps memories at 50, trims each to 280 chars, drops blanks, and nulls empty instructions', () => {
        const longMemory = 'x'.repeat(400)
        const memories = [longMemory, '  ', 'keep me', ...Array.from({ length: 60 }, (_, i) => `m${i}`)]

        const result = chatHelpers.capMemories({ instructions: '   ', memories })

        expect(result.instructions).toBeNull()
        expect(result.memories.length).toBe(50)
        expect(result.memories[0].length).toBe(280)
        expect(result.memories).not.toContain('')
    })

    it('keeps trimmed instructions when present', () => {
        const result = chatHelpers.capMemories({ instructions: '  casual tone  ', memories: [] })
        expect(result.instructions).toBe('casual tone')
    })
})

describe('chatMemoryAi.parseJsonObject', () => {
    it('parses a clean extraction object', () => {
        const parsed = chatMemoryAi.parseJsonObject(
            '{"instructions":"be brief","memories":["a","b"]}',
            chatMemoryAi.ExtractionSchema,
        )
        expect(parsed).toEqual({ instructions: 'be brief', memories: ['a', 'b'] })
    })

    it('extracts JSON embedded in surrounding prose or code fences', () => {
        const raw = 'Sure! ```json\n{"memories":["only fact"]}\n``` done'
        const parsed = chatMemoryAi.parseJsonObject(raw, chatMemoryAi.MemoriesSchema)
        expect(parsed).toEqual({ memories: ['only fact'] })
    })

    it('coerces non-string memory items to empty and defaults missing fields', () => {
        const parsed = chatMemoryAi.parseJsonObject(
            '{"memories":["ok",1,null,"two"]}',
            chatMemoryAi.MemoriesSchema,
        )
        expect(parsed).toEqual({ memories: ['ok', '', '', 'two'] })
    })

    it('returns null when there is no JSON object', () => {
        expect(chatMemoryAi.parseJsonObject('no json here', chatMemoryAi.MemoriesSchema)).toBeNull()
    })
})

describe('chatMemoryAi.naiveSplit', () => {
    it('splits lines, strips list markers, and caps via capMemories', () => {
        const result = chatMemoryAi.naiveSplit('- fact one\n2. fact two\n\n  * fact three  ')
        expect(result.instructions).toBeNull()
        expect(result.memories).toEqual(['fact one', 'fact two', 'fact three'])
    })
})
