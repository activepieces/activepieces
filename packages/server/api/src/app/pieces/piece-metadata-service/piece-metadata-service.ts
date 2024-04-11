import { EntityManager } from 'typeorm'
import { PieceMetadata, 
    PieceMetadataModel,
    PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import {
    ApEdition,
    ListVersionsResponse,
    PackageType,
    PieceCategory,
    PieceOrderBy,
    PieceSortBy,
    PieceType,
    ProjectId,
    SuggestionType,
} from '@activepieces/shared'

type ListParams = {
    release: string
    projectId?: string
    platformId?: string
    includeHidden: boolean
    edition: ApEdition
    categories?: PieceCategory[]
    includeTags?: boolean
    tags?: string[]
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


type ListVersionsParams = {
    name: string
    projectId: string | undefined
    release: string | undefined
    edition: ApEdition
    platformId: string | undefined
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

type UpdateUsage = {
    id: string
    usage: number
}

type GetExactPieceVersionParams = {
    name: string
    version: string
    projectId: ProjectId
}

export type PieceMetadataService = {
    list(params: ListParams): Promise<PieceMetadataModelSummary[]>
    getOrThrow(params: GetOrThrowParams): Promise<PieceMetadataModel>
    getVersions(params: ListVersionsParams): Promise<ListVersionsResponse>
    create(params: CreateParams): Promise<PieceMetadataModel>
    delete(params: DeleteParams): Promise<void>
    updateUsage(params: UpdateUsage): Promise<void>
    getExactPieceVersion(params: GetExactPieceVersionParams): Promise<string>
}
