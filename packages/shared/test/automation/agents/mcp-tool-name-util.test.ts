import { mcpToolNameUtils } from '../../../src/lib/automation/agents/mcp-tool-name-util'

const { createToolName, createPieceToolName } = mcpToolNameUtils

describe('createToolName', () => {
    it('replaces special characters with underscores', () => {
        expect(createToolName('hello world!')).toBe('hello_world_jzwpy2_mcp')
    })

    it('collapses multiple underscores into one', () => {
        expect(createToolName('hello   world')).toBe('hello_world_jzwpy2_mcp')
    })

    it('converts to lowercase', () => {
        expect(createToolName('HelloWorld')).toBe('helloworld_xxkdhh_mcp')
    })

    it('appends _mcp suffix', () => {
        expect(createToolName('my_tool')).toBe('my_tool_m2ch2u_mcp')
    })

    it('truncates long names and appends hash + _mcp within 64 chars', () => {
        const longName = 'a'.repeat(70)
        const result = createToolName(longName)
        expect(result).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_omppph_mcp')
        expect(result.length).toBeLessThanOrEqual(64)
    })

    it('never exceeds 64 characters for very long inputs', () => {
        const result = createToolName('a'.repeat(100))
        expect(result.length).toBeLessThanOrEqual(64)
    })

    it('collision resistance: names sharing first 53+ chars produce different results', () => {
        const name1 = 'a'.repeat(55) + 'b'
        const name2 = 'a'.repeat(55) + 'c'
        const result1 = createToolName(name1)
        const result2 = createToolName(name2)
        // Same truncated prefix but different hashes
        expect(result1.slice(0, 53)).toBe(result2.slice(0, 53))
        expect(result1).not.toBe(result2)
    })
})

describe('createPieceToolName', () => {
    it('strips @scope/piece- prefix', () => {
        expect(createPieceToolName('@activepieces/piece-slack', 'send_message')).toBe('slack-send_message_pqyv3q_mcp')
    })

    it('strips plain piece- prefix', () => {
        expect(createPieceToolName('piece-github', 'create_issue')).toBe('github-create_issue_gmsjqn_mcp')
    })

    it('handles names without piece- prefix', () => {
        expect(createPieceToolName('slack', 'send_message')).toBe('slack-send_message_pqyv3q_mcp')
    })

    it('normalizes the combined name correctly', () => {
        expect(createPieceToolName('@activepieces/piece-google-sheets', 'insert_row')).toBe('google-sheets-insert_row_q388b6_mcp')
    })
})
