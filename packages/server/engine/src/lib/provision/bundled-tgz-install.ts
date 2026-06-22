import { EngineGenericError, ProvisionOperation } from '@activepieces/shared'
import { PieceInstallStrategy } from './piece-install-strategy'

// Serverless strategy: install the flow's pieces from pre-built .tgz bundles in parallel
// (Promise.all of `bun install <piece>.tgz`), with no local cache (stateless).
export const bundledTgzInstall: PieceInstallStrategy = {
    async install(_operation: ProvisionOperation): Promise<void> {
        throw new EngineGenericError('NotImplemented', 'BUNDLED_TGZ install strategy is not implemented yet')
    },
}
