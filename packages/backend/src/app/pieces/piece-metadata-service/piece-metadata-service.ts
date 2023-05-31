import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'

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
}
