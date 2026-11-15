import { describe, expect, it } from 'vitest'
import { mergeConnectionMetadata } from '../../../../src/app/app-connection/app-connection-service/connection-metadata'

describe('mergeConnectionMetadata', () => {
    it('returns undefined when there is nothing to store', () => {
        expect(mergeConnectionMetadata({ requestMetadata: undefined, existingMetadata: undefined, accountIdentifier: undefined })).toBeUndefined()
        expect(mergeConnectionMetadata({ requestMetadata: undefined, existingMetadata: null, accountIdentifier: undefined })).toBeUndefined()
    })

    it('writes the resolved account identifier', () => {
        expect(mergeConnectionMetadata({ requestMetadata: undefined, existingMetadata: undefined, accountIdentifier: 'alice@corp.com' }))
            .toStrictEqual({ accountIdentifier: 'alice@corp.com' })
    })

    it('clears a previously resolved account identifier when resolution misses', () => {
        expect(mergeConnectionMetadata({ requestMetadata: undefined, existingMetadata: { accountIdentifier: 'alice@corp.com' }, accountIdentifier: undefined }))
            .toStrictEqual({})
    })

    it('overwrites a previously resolved account identifier when the account changes', () => {
        expect(mergeConnectionMetadata({ requestMetadata: undefined, existingMetadata: { accountIdentifier: 'alice@corp.com' }, accountIdentifier: 'bob@corp.com' }))
            .toStrictEqual({ accountIdentifier: 'bob@corp.com' })
    })

    it('keeps unrelated existing metadata keys', () => {
        expect(mergeConnectionMetadata({ requestMetadata: undefined, existingMetadata: { pinned: true, accountIdentifier: 'alice@corp.com' }, accountIdentifier: undefined }))
            .toStrictEqual({ pinned: true })
    })

    it('strips a caller-supplied account identifier', () => {
        expect(mergeConnectionMetadata({ requestMetadata: { accountIdentifier: 'ceo@corp.com', note: 'x' }, existingMetadata: undefined, accountIdentifier: undefined }))
            .toStrictEqual({ note: 'x' })
        expect(mergeConnectionMetadata({ requestMetadata: { accountIdentifier: 'ceo@corp.com' }, existingMetadata: undefined, accountIdentifier: 'alice@corp.com' }))
            .toStrictEqual({ accountIdentifier: 'alice@corp.com' })
    })

    it('carries the stored identifier through an update that supplies its own metadata', () => {
        expect(mergeConnectionMetadata({ requestMetadata: { note: 'x' }, existingMetadata: { accountIdentifier: 'alice@corp.com' }, accountIdentifier: 'alice@corp.com' }))
            .toStrictEqual({ note: 'x', accountIdentifier: 'alice@corp.com' })
    })

    it('drops a forged identifier from an update while keeping the stored one', () => {
        expect(mergeConnectionMetadata({ requestMetadata: { accountIdentifier: 'ceo@corp.com' }, existingMetadata: { accountIdentifier: 'alice@corp.com' }, accountIdentifier: 'alice@corp.com' }))
            .toStrictEqual({ accountIdentifier: 'alice@corp.com' })
    })

    it('prefers caller metadata over existing metadata', () => {
        expect(mergeConnectionMetadata({ requestMetadata: { note: 'new' }, existingMetadata: { note: 'old', pinned: true }, accountIdentifier: 'alice@corp.com' }))
            .toStrictEqual({ note: 'new', accountIdentifier: 'alice@corp.com' })
    })
})
