import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { AllPiecesStats } from './piece-stats-service'

export type ListParams = {
    release: string
}

export type GetParams = {
    name: string
    version: string
}

export type PieceMetadataService = {
    list(params: ListParams): Promise<PieceMetadataSummary[]>
    get(params: GetParams): Promise<PieceMetadata>
    stats(): Promise<AllPiecesStats>
}
