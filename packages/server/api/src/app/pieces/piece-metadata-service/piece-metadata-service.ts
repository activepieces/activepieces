import { PieceMetadata } from '@activepieces/pieces-framework'
import {
    ApEdition,
    PackageType,
    PieceCategory,
    PieceOrderBy,
    PieceSortBy,
    PieceType,
    ProjectId,
    SuggestionType,
} from '@activepieces/shared'
import {
    PieceMetadataModel,
    PieceMetadataModelSummary,
} from '../piece-metadata-entity'
import { EntityManager } from 'typeorm'

type ListParams = {
    release: string
    projectId?: string
    platformId?: string
    includeHidden: boolean
    edition: ApEdition
    categories?: PieceCategory[]
    sortBy?: PieceSortBy
    orderBy?: PieceOrderBy
    searchQuery?: string
    suggestionType?: SuggestionType
}

type GetOrThrowParams = {
    name: string
    version: string | undefined
    projectId: string | undefined
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
    getExactPieceVersion(params: GetExactPieceVersionParams): Promise<string>
}
