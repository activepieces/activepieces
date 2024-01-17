import { PieceMetadata } from '@activepieces/pieces-framework'
import { AllPiecesStats } from './piece-stats-service'
import { ApEdition, PackageType, PieceType, ProjectId } from '@activepieces/shared'
import { PieceMetadataModel, PieceMetadataModelSummary } from '../piece-metadata-entity'
import { EntityManager } from 'typeorm'

type ListParams = {
    release: string
    projectId?: string
    platformId?: string
    includeHidden: boolean
    edition: ApEdition
}

type GetOrThrowParams = {
    name: string
    version?: string
    projectId?: string
    entityManager?: EntityManager
}

type DeleteParams = {
    id: string
    projectId?: string
}

type CreateParams = {
    pieceMetadata: PieceMetadata
    platformId?: string
    projectId?: string
    packageType: PackageType
    pieceType: PieceType
    archiveId?: string
}

type GetExactPieceVersionParams = {
    name: string
    version: string
    projectId: ProjectId
}

export type PieceMetadataService = {
    list(params: ListParams): Promise<PieceMetadataModelSummary[]>
    getOrThrow(params: GetOrThrowParams): Promise<PieceMetadataModel>
    create(params: CreateParams): Promise<PieceMetadataModel>
    delete(params: DeleteParams): Promise<void>
    stats(): Promise<AllPiecesStats>
    getExactPieceVersion(params: GetExactPieceVersionParams): Promise<string>
}
