import { ApEnvironment } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { PieceMetadataService } from './piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { AggregatedPieceMetadataService } from './aggregated-metadata-service'

const initPieceMetadataService = (): PieceMetadataService => {
    const env = system.get(SystemProp.ENVIRONMENT)

    if (env === ApEnvironment.DEVELOPMENT) {
        return FilePieceMetadataService()
    }

    return AggregatedPieceMetadataService()
}

export const pieceMetadataService = initPieceMetadataService()
