import { PiecePackage } from '@activepieces/shared'
import { packageManager } from '../../../helper/package-manager'
import { PieceManager } from './piece-manager'

export class RegistryPieceManager extends PieceManager {
    protected override async installDependencies({ projectPath, pieces }: InstallParams): Promise<void> {
        const dependencies = pieces.map(this.pieceToDependency, this)

        await packageManager.add({
            path: projectPath,
            dependencies,
        })
    }
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
}
