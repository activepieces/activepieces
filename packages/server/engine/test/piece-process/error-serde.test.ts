import { ConnectionNotFoundError, EngineGenericError, ExecutionError, ExecutionErrorType } from '@activepieces/shared'
import { reconstructEngineError, serializeEngineError } from '../../src/lib/piece-process/error-serde'

describe('piece-process error serde', () => {
    it('preserves an ENGINE error across the IPC boundary', () => {
        const original = new EngineGenericError('PieceNotFoundError', 'piece missing')

        const reconstructed = reconstructEngineError(serializeEngineError(original))

        expect(reconstructed).toBeInstanceOf(ExecutionError)
        expect(reconstructed.type).toBe(ExecutionErrorType.ENGINE)
        expect(reconstructed.name).toBe('PieceNotFoundError')
        expect(reconstructed.message).toBe(original.message)
    })

    it('keeps a USER ExecutionError as USER', () => {
        const original = new ConnectionNotFoundError('my-conn')

        const reconstructed = reconstructEngineError(serializeEngineError(original))

        expect(reconstructed.type).toBe(ExecutionErrorType.USER)
        expect(reconstructed.message).toBe(original.message)
    })

    it('treats a plain Error as USER', () => {
        const reconstructed = reconstructEngineError(serializeEngineError(new Error('validation failed')))

        expect(reconstructed.type).toBe(ExecutionErrorType.USER)
        expect(reconstructed.message).toBe('validation failed')
    })

    it('treats a non-Error throw as USER', () => {
        const reconstructed = reconstructEngineError(serializeEngineError('boom'))

        expect(reconstructed.type).toBe(ExecutionErrorType.USER)
        expect(reconstructed.message).toBe('boom')
    })
})
