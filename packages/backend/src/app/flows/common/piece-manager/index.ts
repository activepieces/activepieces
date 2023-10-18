import { ApEnvironment } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { PieceManager } from './piece-manager'
import { LocalPieceManager } from './local-piece-manager'
import { RegistryPieceManager } from './registry-piece-manager'

const env = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT)

const getPieceManager = (): PieceManager => {
    const pieceManagerVariant: Record<ApEnvironment, new () => PieceManager> = {
        [ApEnvironment.DEVELOPMENT]: LocalPieceManager,
        [ApEnvironment.PRODUCTION]: RegistryPieceManager,
        [ApEnvironment.TESTING]: RegistryPieceManager,
    }

    return new pieceManagerVariant[env]()
}

export const pieceManager = getPieceManager()
