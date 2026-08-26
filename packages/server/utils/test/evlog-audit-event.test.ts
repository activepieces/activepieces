import { describe, it, expect, afterEach, vi } from 'vitest'
import { initLogger, mockAudit } from 'evlog'
import { auditEvent } from '../src/index'

describe('auditEvent', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('emits a standalone audit event through the global evlog logger', () => {
        initLogger({ env: { service: 'audit-event-test' }, silent: true })
        const captured = mockAudit()
        auditEvent({
            action: 'flow.created',
            actor: { type: 'user', id: 'usr_1', email: 'a@example.com' },
            target: { type: 'project', id: 'proj_1', data: { flow: { id: 'fl_1' } } },
        })
        expect(captured.toIncludeAuditOf({
            action: 'flow.created',
            actor: { type: 'user', id: 'usr_1' },
            target: { type: 'project', id: 'proj_1' },
            outcome: 'success',
        })).toBe(true)
        captured.restore()
    })
})