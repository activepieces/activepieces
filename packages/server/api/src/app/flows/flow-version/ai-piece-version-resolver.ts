import {
    AI_PIECE_NAME,
    AI_PIECE_PROVIDER_INTRODUCED_AT,
    AIProviderName,
    getEffectiveProviderAndModel,
    isNil,
    PlatformId,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'

export async function findCompatiblePieceVersion({
    platformId,
    projectId,
    targetProvider,
    targetModel,
    log,
}: FindCompatiblePieceVersionParams): Promise<FindCompatiblePieceVersionResult> {
    const effective = getEffectiveProviderAndModel({
        provider: targetProvider,
        model: targetModel,
    })
    const effectiveTargetProvider = toAIProviderName(effective.provider)
    if (isNil(effectiveTargetProvider)) {
        return { pieceVersion: null, minRequiredPieceVersion: null, effectiveTargetProvider: null }
    }

    const installed = await pieceMetadataService(log).get({
        name: AI_PIECE_NAME,
        version: undefined,
        platformId,
        projectId,
    })
    const installedVersion = installed?.version ?? null
    const minRequired = AI_PIECE_PROVIDER_INTRODUCED_AT[effectiveTargetProvider]

    if (isNil(installedVersion)) {
        return { pieceVersion: null, minRequiredPieceVersion: minRequired, effectiveTargetProvider }
    }

    if (semVer.gte(installedVersion, minRequired)) {
        return { pieceVersion: installedVersion, minRequiredPieceVersion: minRequired, effectiveTargetProvider }
    }

    return { pieceVersion: null, minRequiredPieceVersion: minRequired, effectiveTargetProvider }
}

function toAIProviderName(value: string | undefined): AIProviderName | null {
    if (isNil(value)) {
        return null
    }
    const knownValues = Object.values(AIProviderName)
    const found = knownValues.find((v) => v === value)
    return found ?? null
}

export type FindCompatiblePieceVersionParams = {
    platformId: PlatformId
    projectId: ProjectId
    targetProvider: string
    targetModel: string
    log: FastifyBaseLogger
}

export type FindCompatiblePieceVersionResult = {
    pieceVersion: string | null
    minRequiredPieceVersion: string | null
    effectiveTargetProvider: AIProviderName | null
}
