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
    PlatformId,
    ProjectId,
    SuggestionType,
} from '@activepieces/shared'
import { EntityManager } from 'typeorm'

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
    entityManager?: EntityManager
    projectId: string | undefined
    platformId: string | undefined
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
    platformId: PlatformId
}

export type PieceMetadataService = {
    list(params: ListParams): Promise<PieceMetadataModelSummary[]>
    get(params: GetOrThrowParams): Promise<PieceMetadataModel | undefined>
    getOrThrow(params: GetOrThrowParams): Promise<PieceMetadataModel>
    getVersions(params: ListVersionsParams): Promise<ListVersionsResponse>
    create(params: CreateParams): Promise<PieceMetadataModel>
    delete(params: DeleteParams): Promise<void>
    updateUsage(params: UpdateUsage): Promise<void>
    getExactPieceVersion(params: GetExactPieceVersionParams): Promise<string>
}
