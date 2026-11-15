import { describe, expect, it } from 'vitest'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { agentMemoryAi } from '../../../../src/app/ee/agent/agent-memory-ai'

describe('agentHelpers.capMemories', () => {
    it('caps memories at 50, trims each to 280 chars, drops blanks, and nulls empty instructions', () => {
        const longMemory = 'x'.repeat(400)
        const memories = [longMemory, '  ', 'keep me', ...Array.from({ length: 60 }, (_, i) => `m${i}`)]

        const result = agentHelpers.capMemories({ instructions: '   ', memories })

        expect(result.instructions).toBeNull()
        expect(result.memories.length).toBe(50)
        expect(result.memories[0].length).toBe(280)
        expect(result.memories).not.toContain('')
    })

    it('keeps trimmed instructions when present', () => {
        const result = agentHelpers.capMemories({ instructions: '  casual tone  ', memories: [] })
        expect(result.instructions).toBe('casual tone')
    })
})

describe('agentHelpers.mergeMemories (3-way, concurrency-safe)', () => {
    it('applies my reconciled list when nothing changed concurrently', () => {
        const result = agentHelpers.mergeMemories({ base: ['burgers'], incoming: ['pizza'], current: ['burgers'] })
        expect(result).toEqual(['pizza'])
    })

    it('preserves a fact added concurrently by another request', () => {
        const result = agentHelpers.mergeMemories({ base: ['burgers'], incoming: ['burgers', 'pizza'], current: ['burgers', 'cheese'] })
        expect(result).toEqual(['burgers', 'pizza', 'cheese'])
    })

    it('does not restore a fact deleted concurrently by another request', () => {
        const result = agentHelpers.mergeMemories({ base: ['burgers'], incoming: ['burgers', 'pizza'], current: [] })
        expect(result).toEqual(['pizza'])
    })

    it('does not restore a wording superseded concurrently', () => {
        const result = agentHelpers.mergeMemories({ base: ['prefers burgers'], incoming: ['prefers burgers'], current: ['prefers steak'] })
        expect(result).toEqual(['prefers steak'])
    })

    it('honors my own deletion', () => {
        const result = agentHelpers.mergeMemories({ base: ['burgers', 'pizza'], incoming: ['pizza'], current: ['burgers', 'pizza'] })
        expect(result).toEqual(['pizza'])
    })
})

describe('agentMemoryAi.parseJsonObject', () => {
    it('parses a clean extraction object', () => {
        const parsed = agentMemoryAi.parseJsonObject(
            '{"instructions":"be brief","memories":["a","b"]}',
            agentMemoryAi.ExtractionSchema,
        )
        expect(parsed).toEqual({ instructions: 'be brief', memories: ['a', 'b'] })
    })

    it('extracts JSON embedded in surrounding prose or code fences', () => {
        const raw = 'Sure! ```json\n{"memories":["only fact"]}\n``` done'
        const parsed = agentMemoryAi.parseJsonObject(raw, agentMemoryAi.MemoriesSchema)
        expect(parsed).toEqual({ memories: ['only fact'] })
    })

    it('coerces non-string memory items to empty and defaults missing fields', () => {
        const parsed = agentMemoryAi.parseJsonObject(
            '{"memories":["ok",1,null,"two"]}',
            agentMemoryAi.MemoriesSchema,
        )
        expect(parsed).toEqual({ memories: ['ok', '', '', 'two'] })
    })

    it('returns null when there is no JSON object', () => {
        expect(agentMemoryAi.parseJsonObject('no json here', agentMemoryAi.MemoriesSchema)).toBeNull()
    })
})

describe('agentMemoryAi.naiveSplit', () => {
    it('splits lines, strips list markers, and caps via capMemories', () => {
        const result = agentMemoryAi.naiveSplit('- fact one\n2. fact two\n\n  * fact three  ')
        expect(result.instructions).toBeNull()
        expect(result.memories).toEqual(['fact one', 'fact two', 'fact three'])
    })
})
