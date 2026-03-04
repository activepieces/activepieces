import { mcpToolNameUtils } from '../../../src/lib/automation/agents/mcp-tool-name-util'

const { createToolName, createPieceToolName } = mcpToolNameUtils

describe('createToolName', () => {
    it('replaces special characters with underscores', () => {
        expect(createToolName('hello world!')).toBe('hello_world__mcp')
    })

    it('collapses multiple underscores into one', () => {
        expect(createToolName('hello   world')).toBe('hello_world_mcp')
    })

    it('converts to lowercase', () => {
        expect(createToolName('HelloWorld')).toBe('helloworld_mcp')
    })

    it('appends _mcp suffix', () => {
        expect(createToolName('my_tool')).toBe('my_tool_mcp')
    })

    it('is idempotent (does not double-append _mcp)', () => {
        expect(createToolName('my_tool_mcp')).toBe('my_tool_mcp')
    })

    it('truncates to 60 chars before appending _mcp', () => {
        const longName = 'a'.repeat(70)
        const result = createToolName(longName)
        expect(result).toBe('a'.repeat(60) + '_mcp')
    })

    it('truncates and still appends _mcp when truncated result ends with _mcp', () => {
        // 56 a's + '_mcp' = 60 chars, so after slice(0,60) it ends with _mcp
        const name = 'a'.repeat(56) + '_mcp_extra'
        const result = createToolName(name)
        expect(result.endsWith('_mcp')).toBe(true)
        expect(result.length).toBeLessThanOrEqual(64)
    })
})

describe('createPieceToolName', () => {
    it('strips @scope/piece- prefix', () => {
        expect(createPieceToolName('@activepieces/piece-slack', 'send_message')).toBe('slack-send_message_mcp')
    })

    it('strips plain piece- prefix', () => {
        expect(createPieceToolName('piece-github', 'create_issue')).toBe('github-create_issue_mcp')
    })

    it('handles names without piece- prefix', () => {
        expect(createPieceToolName('slack', 'send_message')).toBe('slack-send_message_mcp')
    })

    it('normalizes the combined name correctly', () => {
        expect(createPieceToolName('@activepieces/piece-google-sheets', 'insert_row')).toBe('google-sheets-insert_row_mcp')
    })
})
