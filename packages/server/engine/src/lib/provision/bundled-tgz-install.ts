import { EngineGenericError, ProvisionOperation } from '@activepieces/shared'
import { PieceInstallStrategy } from './piece-install-strategy'

// Serverless strategy: `bun install <bundle.tgz>` where all of the flow's pieces are bundled into a
// single archive, installed in one shot with no local cache (stateless). Ships in a later PR — see
// [[project_multi_runtime_engine_install]].
export const bundledTgzInstall: PieceInstallStrategy = {
    async install(_operation: ProvisionOperation): Promise<void> {
        throw new EngineGenericError('NotImplemented', 'BUNDLED_TGZ install strategy is not implemented yet')
    },
}
