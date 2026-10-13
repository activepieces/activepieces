import { mcpToolNameUtils as pieceTypesUtils } from '@activepieces/core-piece-types'
import { mcpToolNameUtils } from '../../../src/lib/agents/mcp-tool-name-util'

const { createToolName, createPieceToolName, toValidToolName, suggestToolName } = mcpToolNameUtils

describe('mcpToolNameUtils canonicalization', () => {
    it('resolves to the same implementation from both entry points', () => {
        expect(mcpToolNameUtils).toBe(pieceTypesUtils)
    })
})

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

describe('toValidToolName', () => {
    it('leaves a name every provider already accepts', () => {
        for (const name of ['company_docs', 'ap_show_questions', 'slack-send_message', 'a']) {
            expect(toValidToolName(name)).toBe(name)
        }
    })

    it('rewrites a name a provider would reject', () => {
        expect(toValidToolName('Company Docs')).toBe(createToolName('Company Docs'))
        expect(toValidToolName('文档')).toBe(createToolName('文档'))
    })

    it('rewrites names that one provider accepts and another rejects', () => {
        expect(toValidToolName('handbook.pdf')).not.toBe('handbook.pdf')
        expect(toValidToolName('2024_reports')).toMatch(/^[a-zA-Z_]/)
    })

    it('gives distinct names to inputs that sanitize to nothing', () => {
        const collapsed = ['文档', '検索', '!!!', '   '].map(toValidToolName)

        expect(new Set(collapsed).size).toBe(4)
    })

    it('rewrites a slug that is merely too long, which no character check would catch', () => {
        const overLong = 'q3_2026_company_handbook_and_employee_onboarding_guide_revision_4_pdf'

        expect(overLong.length).toBeGreaterThan(64)
        expect(toValidToolName(overLong).length).toBeLessThanOrEqual(64)
    })

    it('is idempotent, so re-running it cannot drift a stored name', () => {
        for (const name of ['Company Docs', 'a'.repeat(100), '!!!', ' ']) {
            const once = toValidToolName(name)
            expect(toValidToolName(once)).toBe(once)
            expect(once).toMatch(/^[a-zA-Z0-9_.-]{1,64}$/)
        }
    })
})

describe('suggestToolName', () => {
    it('keeps a readable slug, so the dialog does not show a hashed name for an ordinary file', () => {
        expect(suggestToolName('Company Handbook.pdf')).toBe('company_handbook_pdf')
        expect(suggestToolName('Products Catalog')).toBe('products_catalog')
    })

    it('still guarantees a name every provider accepts', () => {
        for (const sourceName of ['Q3 2026 Company Handbook and Employee Onboarding Guide Revision 4.pdf', '2024 Reports', '文档', '!!!']) {
            expect(suggestToolName(sourceName)).toMatch(/^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/)
        }
    })
})
