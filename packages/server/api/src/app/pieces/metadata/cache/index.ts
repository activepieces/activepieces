import { AppSystemProp } from '@activepieces/server-shared'
import { ApEnvironment, LocalesEnum, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { PieceMetadataSchema } from '../piece-metadata-entity'
import { lruPieceCache } from './lru-piece-cache'
import { testLocalPieceCache } from './test-local-piece-cache'

export const REDIS_REFRESH_LOCAL_PIECES_CHANNEL = 'refresh-local-pieces-cache'

export const localPieceCache = (log: FastifyBaseLogger): LocalPieceCache => {
    const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
    
    if (environment === ApEnvironment.TESTING) {
        return testLocalPieceCache(log)
    }
    
    return lruPieceCache(log)
}

export type LocalPieceCache = {
    setup(): Promise<void>
    refresh(): Promise<void>
    getList(params: GetListParams): Promise<PieceMetadataSchema[]>
    getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null>
    getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]>
}

export type State = {
    recentUpdate: string | undefined
    count: string
}

export type GetPieceVersionParams = {
    pieceName: string
    version: string
    platformId?: string
}

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}

export type GetListParams = {
    platformId?: string
    locale?: LocalesEnum
}

export type GetRegistryParams = {
    release: string | undefined
    platformId?: string
}

