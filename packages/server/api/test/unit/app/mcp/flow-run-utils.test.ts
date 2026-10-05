import { FlowRunStatus } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { ActionRunResult } from '../../../../src/app/action-run/action-run.service'
import { formatPieceActionRunResult } from '../../../../src/app/mcp/tools/flow-run-utils'

const failedRun: ActionRunResult = {
    id: 'run-1',
    status: FlowRunStatus.FAILED,
    output: null,
    logs: null,
    errorMessage: 'Slack API returned 401 invalid_auth',
    neverStarted: false,
}

describe('piece action run result', () => {
    // The activity recorder reads isError and nothing else — not the ❌ glyph and not
    // errorSummary — so a run that failed at the vendor landed in the feed as SUCCEEDED
    // with no message. The flag has to be set here, where the outcome is known.
    it('flags a failed run as an error', () => {
        const result = formatPieceActionRunResult({
            outcome: failedRun,
            runId: failedRun.id,
            displayName: 'Send Channel Message',
            actionName: 'send_channel_message',
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('❌')
        expect(result.content[0].text).toContain('failed (run run-1)')
        expect(result.structuredContent?.errorSummary).toContain('invalid_auth')
    })

    it('flags a failed run with no error message', () => {
        const result = formatPieceActionRunResult({
            outcome: { ...failedRun, errorMessage: null },
            runId: failedRun.id,
            displayName: 'Send Channel Message',
        })

        expect(result.isError).toBe(true)
        expect(result.structuredContent?.errorSummary).toBe('The step failed without an error message.')
    })

    it('leaves a successful run unflagged', () => {
        const result = formatPieceActionRunResult({
            outcome: { ...failedRun, status: FlowRunStatus.SUCCEEDED, errorMessage: null, output: { ok: true } },
            runId: 'run-2',
            displayName: 'Send Channel Message',
        })

        expect(result.isError).toBeUndefined()
        expect(result.structuredContent).toBeUndefined()
        expect(result.content[0].text).toContain('✅')
    })
})
