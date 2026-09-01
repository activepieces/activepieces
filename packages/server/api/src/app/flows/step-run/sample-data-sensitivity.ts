import { isNil } from '@activepieces/core-utils'
import { SampleDataFileType } from '@activepieces/shared'

export function resolveSensitivitySetting({ type, requestedPaths, existingPaths, existingPieceVersion, currentPieceVersion }: ResolveSensitivitySettingParams): SensitivitySetting {
    const callerComputedPaths = type === SampleDataFileType.OUTPUT && !isNil(requestedPaths)
    return {
        sensitiveOutputPaths: callerComputedPaths ? requestedPaths : existingPaths,
        sensitiveOutputPathsPieceVersion: callerComputedPaths ? currentPieceVersion : existingPieceVersion,
    }
}

type ResolveSensitivitySettingParams = {
    type: SampleDataFileType
    requestedPaths: string[] | undefined
    existingPaths: string[] | undefined
    existingPieceVersion: string | undefined
    currentPieceVersion: string | undefined
}

type SensitivitySetting = {
    sensitiveOutputPaths: string[] | undefined
    sensitiveOutputPathsPieceVersion: string | undefined
}
