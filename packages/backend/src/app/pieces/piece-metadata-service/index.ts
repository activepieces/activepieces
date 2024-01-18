import { PiecesSource, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { PieceMetadataService } from './piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { DbPieceMetadataService } from './db-piece-metadata-service'
import { AggregatedPieceMetadataService } from './aggregated-metadata-service'

const initPieceMetadataService = (): PieceMetadataService => {
    const source = system.getOrThrow<PiecesSource>(SystemProp.PIECES_SOURCE)
    switch (source) {
        case PiecesSource.DB:
            return DbPieceMetadataService()
        case PiecesSource.FILE:
            return FilePieceMetadataService()
        case PiecesSource.CLOUD_AND_DB:
            return AggregatedPieceMetadataService()
    }
}

export const pieceMetadataService = initPieceMetadataService()
