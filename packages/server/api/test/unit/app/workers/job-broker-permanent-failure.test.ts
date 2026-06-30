import { describe, expect, it } from 'vitest'
import { isPermanentEngineFailure } from '../../../../src/app/workers/job-queue/job-broker'

describe('isPermanentEngineFailure', () => {
    it('treats a deleted connection as permanent', () => {
        expect(isPermanentEngineFailure('Internal error\nstderr:\nConnectionNotFound: { "message": "connection (X) not found" }')).toBe(true)
    })

    it('treats an expired connection as permanent', () => {
        expect(isPermanentEngineFailure('ConnectionExpired: { "message": "connection (X) expired" }')).toBe(true)
    })

    it('treats a 404 trigger-payload download as permanent', () => {
        expect(isPermanentEngineFailure('Internal error\nstderr:\nEngineFileDownloadError: { "message": "Failed to download file Y: 404 Not Found" }')).toBe(true)
    })

    it('keeps a transient 5xx download error retryable', () => {
        expect(isPermanentEngineFailure('EngineFileDownloadError: { "message": "Failed to download file Y: 503 Service Unavailable" }')).toBe(false)
    })

    it('keeps a generic engine crash retryable', () => {
        expect(isPermanentEngineFailure('SANDBOX_INTERNAL_ERROR: Worker exited with code 1 and signal null')).toBe(false)
    })
})
