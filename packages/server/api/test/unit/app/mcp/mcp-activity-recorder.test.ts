import { apId } from '@activepieces/core-utils'
import { MCP_ACTIVITY_PAYLOAD_MAX_BYTES, McpServerType, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it } from 'vitest'
import { capPayload, runActionFieldsFrom, shouldRecord } from '../../../../src/app/mcp/activity/mcp-activity-recorder'
import { activepiecesTools } from '../../../../src/app/mcp/tools'

const noopLog: FastifyBaseLogger = {
    level: 'silent',
    silent: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    trace: () => undefined,
    fatal: () => undefined,
    child: () => noopLog,
}

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
    it('every registered tool declares all three safety hints', () => {
        const missing = activepiecesTools(mcp, apId(), noopLog)
            .filter((tool) => [tool.annotations?.readOnlyHint, tool.annotations?.destructiveHint, tool.annotations?.openWorldHint].some((hint) => hint === undefined))
            .map((tool) => tool.title)

        expect(missing).toEqual([])
    })

    it('records ap_run_action and nothing else', () => {
        const tools = activepiecesTools(mcp, apId(), noopLog)
        const recorded = tools.filter(shouldRecord).map((tool) => tool.title)

        expect(recorded).toEqual(['ap_run_action'])
    })

    it('does not record the mutating tools it used to', () => {
        const tools = activepiecesTools(mcp, apId(), noopLog)
        const recorded = tools.filter(shouldRecord).map((tool) => tool.title)

        expect(recorded).not.toContain('ap_create_flow')
        expect(recorded).not.toContain('ap_delete_flow')
        expect(recorded).not.toContain('ap_insert_records')
        expect(recorded).not.toContain('ap_lock_and_publish')
    })
})

describe('MCP activity run-action fields', () => {
    it('takes the connection from connectionExternalId', () => {
        expect(runActionFieldsFrom({ pieceName: 'slack', actionName: 'send_channel_message', connectionExternalId: 'conn-1' }))
            .toEqual({ pieceName: 'slack', actionName: 'send_channel_message', connectionExternalId: 'conn-1' })
    })

    it('falls back to the legacy string input.auth', () => {
        expect(runActionFieldsFrom({ pieceName: 'slack', input: { auth: 'conn-legacy' } }))
            .toEqual({ pieceName: 'slack', connectionExternalId: 'conn-legacy' })
    })

    it('prefers connectionExternalId over input.auth', () => {
        expect(runActionFieldsFrom({ connectionExternalId: 'conn-1', input: { auth: 'conn-legacy' } }))
            .toEqual({ connectionExternalId: 'conn-1' })
    })

    it('records no connection when the call carried none', () => {
        expect(runActionFieldsFrom({ pieceName: 'slack', actionName: 'send_channel_message' }))
            .toEqual({ pieceName: 'slack', actionName: 'send_channel_message' })
    })

    it('ignores a non-string input.auth', () => {
        expect(runActionFieldsFrom({ input: { auth: { externalId: 'conn-1' } } })).toEqual({})
        expect(runActionFieldsFrom({ input: 'not-an-object' })).toEqual({})
    })

    it('truncates the names to their column width', () => {
        const fields = runActionFieldsFrom({
            pieceName: 'p'.repeat(400),
            actionName: 'a'.repeat(400),
            connectionExternalId: 'c'.repeat(400),
        })

        expect(fields.pieceName).toHaveLength(256)
        expect(fields.actionName).toHaveLength(256)
        expect(fields.connectionExternalId).toHaveLength(256)
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
