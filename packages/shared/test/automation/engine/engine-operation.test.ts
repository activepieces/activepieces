import { normalizeToolOutputToExecuteResponse } from '../../../src/lib/automation/engine/engine-operation'
import { ExecutionToolStatus } from '../../../src/lib/automation/agents'

describe('normalizeToolOutputToExecuteResponse', () => {
    it('should return FAILED for null input', () => {
        const result = normalizeToolOutputToExecuteResponse(null)
        expect(result.status).toBe(ExecutionToolStatus.FAILED)
        expect(result.errorMessage).toBe('Invalid tool output')
    })

    it('should return FAILED for primitive input', () => {
        const result = normalizeToolOutputToExecuteResponse('hello')
        expect(result.status).toBe(ExecutionToolStatus.FAILED)
        expect(result.errorMessage).toBe('Invalid tool output')
    })

    it('should pass through object with status SUCCESS', () => {
        const raw = {
            status: ExecutionToolStatus.SUCCESS,
            output: { data: 123 },
            resolvedInput: { key: 'val' },
            errorMessage: undefined,
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.SUCCESS)
        expect(result.output).toEqual({ data: 123 })
        expect(result.resolvedInput).toEqual({ key: 'val' })
    })

    it('should pass through object with status FAILED', () => {
        const raw = {
            status: ExecutionToolStatus.FAILED,
            output: null,
            resolvedInput: {},
            errorMessage: 'something broke',
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.FAILED)
        expect(result.errorMessage).toBe('something broke')
    })

    it('should use structuredContent as output with SUCCESS status', () => {
        const raw = {
            structuredContent: { type: 'table', data: [1, 2] },
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.SUCCESS)
        expect(result.output).toEqual({ type: 'table', data: [1, 2] })
    })

    it('should extract single text part from content array', () => {
        const raw = {
            content: [{ text: 'hello world' }],
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.SUCCESS)
        expect(result.output).toBe('hello world')
    })

    it('should join multiple text parts into { text } object', () => {
        const raw = {
            content: [{ text: 'part1' }, { text: 'part2' }],
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.SUCCESS)
        expect(result.output).toEqual({ text: 'part1part2' })
    })

    it('should return raw content array when no text parts exist', () => {
        const raw = {
            content: [{ image: 'data:...' }],
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.SUCCESS)
        expect(result.output).toEqual([{ image: 'data:...' }])
    })

    it('should use entire object as output when no recognized fields exist', () => {
        const raw = { foo: 'bar', baz: 42 }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.SUCCESS)
        expect(result.output).toEqual({ foo: 'bar', baz: 42 })
    })

    it('should return FAILED when isError is true with content text', () => {
        const raw = {
            isError: true,
            content: [{ text: 'Error occurred' }],
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.FAILED)
        expect(result.output).toBe('Error occurred')
        expect(result.errorMessage).toBe('Error occurred')
    })

    it('should use message as errorMessage fallback when content has no text', () => {
        const raw = {
            isError: true,
            message: 'Fallback error message',
            content: [{ image: 'data:...' }],
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.status).toBe(ExecutionToolStatus.FAILED)
        expect(result.errorMessage).toBe('Fallback error message')
    })

    it('structuredContent should take precedence over content array', () => {
        const raw = {
            structuredContent: { key: 'structured' },
            content: [{ text: 'ignored' }],
        }
        const result = normalizeToolOutputToExecuteResponse(raw)
        expect(result.output).toEqual({ key: 'structured' })
    })
})
