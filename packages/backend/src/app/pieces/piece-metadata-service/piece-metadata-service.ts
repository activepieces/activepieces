import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { AllPiecesStats } from './piece-stats-service'
import { PieceMetadataSchema } from '../piece-metadata-entity'

export type ListParams = {
    release: string
}

export type GetParams = {
    name: string
    version: string
}

export type CreateParams = {
    pieceMetadata: PieceMetadata
}

export type PieceMetadataService = {
    list(params: ListParams): Promise<PieceMetadataSummary[]>
    get(params: GetParams): Promise<PieceMetadata>
    create(params: CreateParams): Promise<PieceMetadataSchema>
    stats(): Promise<AllPiecesStats>
}
