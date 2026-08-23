import { ExecutionError, ExecutionErrorType } from '@activepieces/shared'
import { toExitError } from '../../../src/lib/core/piece/piece-runner'

const heapMessage = 'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory'

describe('piece child exit classification', () => {
    it.each([
        ['the V8 heap message', { code: 1, signal: null, output: heapMessage }],
        ['an abort exit code', { code: 134, signal: null, output: '' }],
        ['SIGABRT', { code: null, signal: 'SIGABRT' as const, output: '' }],
        ['a kernel OOM kill', { code: null, signal: 'SIGKILL' as const, output: '' }],
    ])('reports %s as a user-level memory failure', (_name, exit) => {
        const error = toExitError(exit)

        expect(error).toBeInstanceOf(ExecutionError)
        expect(error).toMatchObject({ name: 'PieceMemoryLimitError', type: ExecutionErrorType.USER })
        expect(JSON.parse(error.message).message).toBe('The piece ran out of memory')
    })

    it('reports any other abnormal exit as an engine error carrying the child output', () => {
        const error = toExitError({ code: 7, signal: null, output: 'some stack trace' })

        expect(error).toMatchObject({ name: 'PieceProcessExitedError', type: ExecutionErrorType.ENGINE })
        expect(error.message).toContain('some stack trace')
    })
})
