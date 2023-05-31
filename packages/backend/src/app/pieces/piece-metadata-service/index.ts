import { ApEnvironment } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { PieceMetadataService } from './piece-metadata-service'
import { FilePieceMetadataService } from './file-piece-metadata-service'
import { DbPieceMetadataService } from './db-piece-metadata-service'

const initPieceMetadataService = (): PieceMetadataService => {
    const env = system.getOrThrow(SystemProp.ENVIRONMENT)

    if (env === ApEnvironment.DEVELOPMENT) {
        return FilePieceMetadataService()
    }

    return DbPieceMetadataService()
}

export const pieceMetadataService = initPieceMetadataService()
