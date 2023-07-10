import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { AllPiecesStats } from './piece-stats-service'

export type ListParams = {
    release: string
    projectId: string | null
}

export type GetParams = {
    name: string
    version: string | undefined 
    projectId: string | null
}

export type DeleteParams = {
    id: string
    projectId: string | null
}

export type CreateParams = {
    pieceMetadata: PieceMetadata
    projectId: string | null
}

export type PieceMetadataService = {
    list(params: ListParams): Promise<PieceMetadataSummary[]>
    get(params: GetParams): Promise<PieceMetadata>
    create(params: CreateParams): Promise<PieceMetadata>
    delete(params: DeleteParams): Promise<void>
    stats(): Promise<AllPiecesStats>
}
