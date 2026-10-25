import { describe, expect, it } from 'vitest'
import { connectionTemplate } from '../src/lib/connection-template'

describe('connectionTemplate.wrapExternalId', () => {
    it('wraps a raw external id', () => {
        expect(connectionTemplate.wrapExternalId('abc')).toBe('{{connections[\'abc\']}}')
    })

    it('leaves an already wrapped value as it is', () => {
        expect(connectionTemplate.wrapExternalId('{{connections[\'abc\']}}')).toBe('{{connections[\'abc\']}}')
    })

    it('returns null for an empty value', () => {
        expect(connectionTemplate.wrapExternalId('')).toBeNull()
        expect(connectionTemplate.wrapExternalId(undefined)).toBeNull()
    })
})

describe('connectionTemplate.isTemplate', () => {
    it('is true for a wrapped connection', () => {
        expect(connectionTemplate.isTemplate('{{connections[\'abc\']}}')).toBe(true)
    })

    it('is false for a raw id or a non string', () => {
        expect(connectionTemplate.isTemplate('abc')).toBe(false)
        expect(connectionTemplate.isTemplate(undefined)).toBe(false)
    })
})
