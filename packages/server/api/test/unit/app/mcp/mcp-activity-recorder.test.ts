import { apId } from '@activepieces/core-utils'
import { MCP_ACTIVITY_PAYLOAD_MAX_BYTES, McpServerType, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it } from 'vitest'
import { capPayload, shouldRecord } from '../../../../src/app/mcp/activity/mcp-activity-recorder'
import { activepiecesTools } from '../../../../src/app/mcp/tools'

const noopLog = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    trace: () => undefined,
    fatal: () => undefined,
    child: () => noopLog,
} as unknown as FastifyBaseLogger

const mcp: ProjectScopedMcpServer = {
    id: apId(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    projectId: apId(),
    platformId: apId(),
    type: McpServerType.PROJECT,
    token: apId(),
    disabledTools: [],
    flows: [],
}

describe('MCP activity recording predicate', () => {
    // shouldRecord() reads annotations.destructiveHint, which McpToolDefinition marks optional.
    // A tool that forgets its hints would be silently unrecorded, so pin that every tool declares them.
    it('every registered tool declares all three safety hints', () => {
        const missing = activepiecesTools(mcp, apId(), noopLog)
            .filter((tool) => [tool.annotations?.readOnlyHint, tool.annotations?.destructiveHint, tool.annotations?.openWorldHint].some((hint) => hint === undefined))
            .map((tool) => tool.title)

        expect(missing).toEqual([])
    })

    it('records ap_run_action and every destructive tool, and nothing that only reads', () => {
        const tools = activepiecesTools(mcp, apId(), noopLog)
        const recorded = tools.filter(shouldRecord).map((tool) => tool.title)

        expect(recorded).toContain('ap_run_action')
        expect(recorded).not.toContain('ap_list_flows')
        expect(recorded).not.toContain('ap_get_piece_props')
        expect(recorded).not.toContain('ap_flow_structure')
        expect(tools.filter((tool) => tool.annotations?.destructiveHint === true).every((tool) => recorded.includes(tool.title))).toBe(true)
    })
})

describe('MCP activity payload cap', () => {
    const under = { note: 'small' }
    const over = { note: 'x'.repeat(200 * 1024) }

    it('keeps a small call whole', () => {
        const { truncated, body } = capPayload({ input: under, output: under })
        expect(truncated).toBe(false)
        expect(JSON.parse(body.toString('utf-8')).output).toEqual(under)
    })

    it('drops the output when the pair is too big but the input fits', () => {
        const { truncated, body } = capPayload({ input: under, output: over })
        expect(truncated).toBe(true)
        const parsed = JSON.parse(body.toString('utf-8'))
        expect(parsed.input).toEqual(under)
        expect(parsed.output).toBeNull()
    })

    it('drops both when the input alone blows the cap', () => {
        const { truncated, body } = capPayload({ input: over, output: over })
        expect(truncated).toBe(true)
        expect(JSON.parse(body.toString('utf-8'))).toEqual({ input: null, output: null })
    })

    it('never writes more than the cap', () => {
        const cases = [{ input: under, output: under }, { input: under, output: over }, { input: over, output: over }]
        cases.forEach((payload) => expect(capPayload(payload).body.length).toBeLessThanOrEqual(MCP_ACTIVITY_PAYLOAD_MAX_BYTES))
    })
})
