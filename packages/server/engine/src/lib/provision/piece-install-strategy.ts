import { EngineGenericError, PieceInstallStrategyKind, ProvisionOperation } from '@activepieces/shared'
import { bundledTgzInstall } from './bundled-tgz-install'

export function selectInstallStrategy(kind: PieceInstallStrategyKind): PieceInstallStrategy {
    switch (kind) {
        case PieceInstallStrategyKind.BUNDLED_TGZ:
            return bundledTgzInstall
        case PieceInstallStrategyKind.LOCAL_CACHE:
            // LOCAL_CACHE runs host-side in the worker-pool runtime (the engine sandbox is locked
            // down and cannot run bun install), so the engine never serves it — see
            // runtime/provision/piece-install-strategy.ts on the worker side.
            throw new EngineGenericError('InvalidInstallStrategy', 'LOCAL_CACHE is provisioned host-side by the worker-pool runtime, not in the engine')
    }
}

// Makes a flow's pieces/code available before EXECUTE_FLOW runs, from inside the engine/function
// (serverless self-install). The host-side worker-pool path uses its own strategy seam instead.
export type PieceInstallStrategy = {
    install(operation: ProvisionOperation): Promise<void>
}
