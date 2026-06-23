import { RuntimeKind } from '@activepieces/shared'
import { getApiUrl, getSocketUrl, system, WorkerSystemProp } from '../config/configs'
import { worker } from '../worker'
import { cloudRunServer } from './cloud-run/cloud-run-server'
import { resolveRuntimeKind } from './runtime-factory'

// One binary, two roles, selected by AP_RUNTIME (see ADR 0001). The switch is exhaustive over RuntimeKind,
// so a new runtime cannot be added without giving it a runner here.
//   GCP_CLOUD_RUN → executor: the /v1/execute HTTP server a dispatcher pushes jobs to.
//   LOCAL         → poller: polls the API, then executes locally or (AP_CLOUD_RUN_URL set) dispatches.
export function selectRunner(): WorkerRunner {
    const workerToken = system.getOrThrow(WorkerSystemProp.WORKER_TOKEN)
    switch (resolveRuntimeKind()) {
        case RuntimeKind.GCP_CLOUD_RUN:
            return {
                start: () => cloudRunServer.start({ socketUrl: getSocketUrl(), workerToken, port: resolvePort() }),
                stop: () => cloudRunServer.stop(),
            }
        case RuntimeKind.LOCAL:
            return {
                start: () => worker.start({
                    apiUrl: getApiUrl(),
                    socketUrl: getSocketUrl(),
                    workerToken,
                    withHealthServer: (system.get(WorkerSystemProp.CONTAINER_TYPE) ?? 'WORKER_AND_APP') === 'WORKER',
                }),
                stop: () => worker.stop(),
            }
    }
}

function resolvePort(): number {
    // Cloud Run injects PORT; fall back to AP_PORT for local runs.
    const raw = process.env['PORT'] ?? system.get(WorkerSystemProp.PORT)
    return Number(raw)
}

export type WorkerRunner = {
    start(): Promise<void>
    stop(): Promise<void>
}
