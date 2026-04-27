import { InputPropertyMap } from '@activepieces/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    isNil,
    PiecePackage,
    PlatformId,
    ProjectId,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'

export const dynamicSchemaResolver = {
    createCache(): DynamicSchemaCache {
        return new Map()
    },

    async resolve({
        cache,
        piece,
        actionName,
        propName,
        refreshers,
        input,
        platformId,
        projectId,
        log,
    }: ResolveDynamicSchemaParams): Promise<InputPropertyMap> {
        const cacheKey = buildCacheKey({ piece, actionName, propName, refreshers, input })
        const cached = cache.get(cacheKey)
        if (!isNil(cached)) {
            return cached
        }

        const watcherResponse = await userInteractionWatcher.submitAndWaitForResponse<EngineResponse<InputPropertyMap | undefined>>({
            jobType: WorkerJobType.EXECUTE_PROPERTY,
            platformId,
            projectId,
            propertyName: propName,
            actionOrTriggerName: actionName,
            input,
            sampleData: {},
            piece,
        }, log)

        if (watcherResponse.status !== EngineResponseStatus.OK) {
            throw new Error(`Failed to resolve ${propName} for action ${actionName}: ${watcherResponse.error ?? 'engine status ' + watcherResponse.status}`)
        }

        const resolved = watcherResponse.response ?? {}
        cache.set(cacheKey, resolved)
        return resolved
    },

    merge({
        schema,
        oldMap,
        propName,
        stepName,
        targetLabel,
    }: MergeDynamicPropertyParams): MergeResult {
        const safeOldMap: Record<string, unknown> = oldMap ?? {}

        if (Object.keys(schema).length === 0) {
            return { verdict: 'passed', resolved: { ...safeOldMap } }
        }

        const merged: Record<string, unknown> = {}
        for (const [subKey, subProp] of Object.entries(schema)) {
            if (subKey in safeOldMap && safeOldMap[subKey] !== undefined) {
                merged[subKey] = safeOldMap[subKey]
                continue
            }
            const defaultValue = subProp?.defaultValue
            if (!isNil(defaultValue)) {
                merged[subKey] = defaultValue
                continue
            }
            if (subProp?.required === true) {
                return {
                    verdict: 'blocked',
                    reason: `Step ${stepName} blocked: ${propName}.${subKey} is required and has no default for ${targetLabel}.`,
                }
            }
        }
        return { verdict: 'passed', resolved: merged }
    },
}

function buildCacheKey({ piece, actionName, propName, refreshers, input }: {
    piece: PiecePackage
    actionName: string
    propName: string
    refreshers: string[]
    input: Record<string, unknown>
}): string {
    const refresherValues = refreshers
        .map((key) => `${key}=${stableStringify(input[key])}`)
        .join('|')
    return `${piece.pieceName}@${piece.pieceVersion}::${actionName}::${propName}::${refresherValues}`
}

function stableStringify(value: unknown): string {
    if (isNil(value)) {
        return 'null'
    }
    if (typeof value !== 'object') {
        return JSON.stringify(value)
    }
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`
    }
    const entries = Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    return `{${entries.join(',')}}`
}

export type DynamicSchemaCache = Map<string, InputPropertyMap>

export type MergeResult =
    | { verdict: 'passed', resolved: Record<string, unknown> }
    | { verdict: 'blocked', reason: string }

type ResolveDynamicSchemaParams = {
    cache: DynamicSchemaCache
    piece: PiecePackage
    actionName: string
    propName: string
    refreshers: string[]
    input: Record<string, unknown>
    platformId: PlatformId
    projectId: ProjectId
    log: FastifyBaseLogger
}

type MergeDynamicPropertyParams = {
    schema: InputPropertyMap
    oldMap: Record<string, unknown> | undefined
    propName: string
    stepName: string
    targetLabel: string
}
