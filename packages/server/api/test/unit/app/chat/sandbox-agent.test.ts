import { describe, expect, it } from 'vitest'
import { SandboxSessionUpdateType } from '../../../../src/app/chat/sandbox/sandbox-agent'

describe('SandboxSessionUpdateType', () => {
    it('AGENT_MESSAGE_CHUNK has the correct wire value', () => {
        expect(SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK).toBe('agent_message_chunk')
    })

    it('AGENT_THOUGHT_CHUNK has the correct wire value', () => {
        expect(SandboxSessionUpdateType.AGENT_THOUGHT_CHUNK).toBe('agent_thought_chunk')
    })

    it('TOOL_CALL has the correct wire value', () => {
        expect(SandboxSessionUpdateType.TOOL_CALL).toBe('tool_call')
    })

    it('TOOL_CALL_UPDATE has the correct wire value', () => {
        expect(SandboxSessionUpdateType.TOOL_CALL_UPDATE).toBe('tool_call_update')
    })

    it('PLAN has the correct wire value', () => {
        expect(SandboxSessionUpdateType.PLAN).toBe('plan')
    })

    it('SESSION_INFO_UPDATE has the correct wire value', () => {
        expect(SandboxSessionUpdateType.SESSION_INFO_UPDATE).toBe('session_info_update')
    })

    it('USAGE_UPDATE has the correct wire value', () => {
        expect(SandboxSessionUpdateType.USAGE_UPDATE).toBe('usage_update')
    })

    it('exposes exactly the expected set of keys', () => {
        const keys = Object.keys(SandboxSessionUpdateType).sort()
        expect(keys).toEqual([
            'AGENT_MESSAGE_CHUNK',
            'AGENT_THOUGHT_CHUNK',
            'PLAN',
            'SESSION_INFO_UPDATE',
            'TOOL_CALL',
            'TOOL_CALL_UPDATE',
            'USAGE_UPDATE',
        ])
    })

    it('all values are unique strings', () => {
        const values = Object.values(SandboxSessionUpdateType)
        const unique = new Set(values)
        expect(unique.size).toBe(values.length)
    })
})
