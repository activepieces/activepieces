import { SampleDataFileType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { resolveSensitivitySetting } from '../../../../../src/app/flows/step-run/sample-data-sensitivity'

const base = {
    existingPaths: ['SecretString'],
    existingPieceVersion: '0.1.0',
    currentPieceVersion: '0.1.1',
}

describe('resolveSensitivitySetting', () => {
    it('stores freshly computed paths and stamps the current piece version', () => {
        expect(resolveSensitivitySetting({ ...base, type: SampleDataFileType.OUTPUT, requestedPaths: ['Token'] })).toEqual({
            sensitiveOutputPaths: ['Token'],
            sensitiveOutputPathsPieceVersion: '0.1.1',
        })
    })

    it('keeps the previous version stamp when the caller did not compute paths, so the serve path re-derives', () => {
        expect(resolveSensitivitySetting({ ...base, type: SampleDataFileType.OUTPUT, requestedPaths: undefined })).toEqual({
            sensitiveOutputPaths: ['SecretString'],
            sensitiveOutputPathsPieceVersion: '0.1.0',
        })
    })

    it('lets an authoritative empty result clear previously stored paths', () => {
        expect(resolveSensitivitySetting({ ...base, type: SampleDataFileType.OUTPUT, requestedPaths: [] })).toEqual({
            sensitiveOutputPaths: [],
            sensitiveOutputPathsPieceVersion: '0.1.1',
        })
    })

    it('leaves output sensitivity untouched on an input save', () => {
        expect(resolveSensitivitySetting({ ...base, type: SampleDataFileType.INPUT, requestedPaths: ['Token'] })).toEqual({
            sensitiveOutputPaths: ['SecretString'],
            sensitiveOutputPathsPieceVersion: '0.1.0',
        })
    })
})
