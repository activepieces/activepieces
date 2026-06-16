import { type ApLogger } from '@activepieces/server-utils'
import { apId, isNil } from '@activepieces/shared'
import { Sandbox } from '../sandbox-contract'
import { ActiveSandboxInfo, FlowExecutionRuntime, ReadyOperation } from '../types'
import { functionProvisioner } from './function-provisioner'
import { createRemoteSandbox } from './remote-sandbox'

// The CLOUD_FUNCTION runtime executes flows on per-project engine functions instead of a local
// pool of sandbox processes. Each function is a self-contained image baked with that project's
// pieces and code (rebuilt on publish), so the runtime does no cache preparation: `ready()`
// provisions (idempotently — see function-provisioner) the project's function and hands back a
// remote sandbox pointed at it. The function is shared infrastructure, so the runtime keeps no
// local process state: invalidate/release/shutdown only drop the in-memory handle, and
// getActiveSandbox reports nothing pid-based.
export function createCloudFunctionRuntime({ slot }: { slot: number }): FlowExecutionRuntime {
    const provisioner = functionProvisioner.create()
    let currentSandbox: Sandbox | null = null

    const drop = (): void => {
        currentSandbox = null
    }

    return {
        async ready({ operation, log, apiClient }): Promise<Sandbox> {
            const projectKey = provisionKey(operation)
            const provisioned = await provisioner.ensure({ projectId: projectKey, log, apiClient })

            const sandbox = createRemoteSandbox({
                id: `fn-${slot}-${apId()}`,
                functionUrl: provisioned.url,
                engineToken: provisioned.engineToken,
                log,
            })
            await sandbox.start({
                flowVersionId: operation.kind === 'FLOW' ? operation.flowVersion.id : undefined,
                platformId: operation.platformId,
                mounts: [],
            })
            currentSandbox = sandbox
            return sandbox
        },
        async invalidate(_log: ApLogger): Promise<void> {
            drop()
        },
        async release(_log: ApLogger): Promise<void> {
            drop()
        },
        async shutdown(_log: ApLogger): Promise<void> {
            drop()
        },
        getActiveSandbox(): ActiveSandboxInfo | null {
            if (isNil(currentSandbox) || !currentSandbox.isReady()) {
                return null
            }
            return {
                sandboxId: currentSandbox.id,
                boxId: slot,
                pid: 0,
                busy: currentSandbox.isBusy(),
            }
        },
    }
}

function provisionKey(operation: ReadyOperation): string {
    return operation.kind === 'FLOW' ? operation.projectId : operation.platformId
}
