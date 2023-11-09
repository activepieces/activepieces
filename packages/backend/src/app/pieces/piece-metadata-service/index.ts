import { ApEdition, ApEnvironment, PiecesSource } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { PieceMetadataService } from './piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { DbPieceMetadataService } from './db-piece-metadata-service'
import { AggregatedPieceMetadataService } from './aggregated-metadata-service'
import { CloudPieceMetadataService } from "./cloud-piece-metadata-service";

const initPieceMetadataService = (): PieceMetadataService => {
    const env = system.get(SystemProp.ENVIRONMENT)
    let source = system.get(SystemProp.PIECES_SOURCE) || PiecesSource.Default
    if (env === ApEnvironment.DEVELOPMENT) {
        source = PiecesSource.File
    }
    else if (system.get(SystemProp.EDITION) === ApEdition.CLOUD) {
        source = PiecesSource.Db
    }

    switch (source) {
        case PiecesSource.File:
            return FilePieceMetadataService()
        case PiecesSource.Cloud:
            return CloudPieceMetadataService();
        case PiecesSource.Db:
            return DbPieceMetadataService();
        case PiecesSource.Aggregated:
            return AggregatedPieceMetadataService();
    }

    throw Error(`Invalid pieces source [${source}]`)
}

export const pieceMetadataService = initPieceMetadataService()
