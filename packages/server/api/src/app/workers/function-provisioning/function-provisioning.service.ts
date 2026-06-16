import { FlowStatus, FlowVersion, FlowVersionState, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock, distributedStore } from '../../database/redis-connections'
import { flowService } from '../../flows/flow/flow.service'
import { cloudFunctionDeployer, CloudFunctionDeployer } from './cloud-function-deployer'
import { functionSourceBuilder } from './function-source-builder'

const PROVISION_LOCK_TIMEOUT_SECONDS = 300
const PROVISIONED_TTL_SECONDS = 60 * 60 * 24

let deployer: CloudFunctionDeployer | null = null

function getDeployer(): CloudFunctionDeployer {
    if (isNil(deployer)) {
        deployer = cloudFunctionDeployer.create()
    }
    return deployer
}

// Provisioning a per-project engine function is cheap because it almost always short-circuits:
//   1. Redis fast-path — a single GET shared across every worker/API node. Hot projects never
//      reach the cloud provider at all.
//   2. Distributed lock — on a cache miss exactly one node across the cluster runs the
//      describe/deploy; everyone else blocks then re-reads the freshly written Redis entry.
//      This is the multi-server safety the codebase requires (see distributedLock rule).
//   3. Double-checked Redis read inside the lock, so a queue of waiters collapses into one
//      deploy instead of N.
// `ensure` only guarantees the function exists (skips deploy via describe if it does). `rebuild`
// is the publish-time path: it always re-bakes the project's pieces + code and redeploys, busting
// the Redis entry so the next run picks up the new function.
export const functionProvisioningService = (log: FastifyBaseLogger): FunctionProvisioningService => ({
    async ensure({ projectId }: EnsureParams): Promise<ProvisionedFunction> {
        const cached = await distributedStore.get<ProvisionedFunction>(redisKey(projectId))
        if (!isNil(cached)) {
            log.debug({ projectId }, '[functionProvisioning] cache hit, skipping provision')
            return cached
        }

        return distributedLock(log).runExclusive({
            key: lockKey(projectId),
            timeoutInSeconds: PROVISION_LOCK_TIMEOUT_SECONDS,
            fn: async () => {
                const recheck = await distributedStore.get<ProvisionedFunction>(redisKey(projectId))
                if (!isNil(recheck)) {
                    log.debug({ projectId }, '[functionProvisioning] provisioned by another node while waiting for lock')
                    return recheck
                }

                const activeDeployer = getDeployer()
                const existingUrl = await activeDeployer.describe({ projectId, log })
                if (!isNil(existingUrl)) {
                    log.info({ projectId, url: existingUrl }, '[functionProvisioning] function already exists, skipping deploy')
                    return persist({ projectId, url: existingUrl, engineToken: activeDeployer.engineToken })
                }
                return deployFresh({ projectId, log, deployer: activeDeployer })
            },
        })
    },

    async rebuild({ projectId }: EnsureParams): Promise<ProvisionedFunction> {
        return distributedLock(log).runExclusive({
            key: lockKey(projectId),
            timeoutInSeconds: PROVISION_LOCK_TIMEOUT_SECONDS,
            fn: async () => {
                await distributedStore.delete(redisKey(projectId))
                log.info({ projectId }, '[functionProvisioning] rebuilding project function on publish')
                return deployFresh({ projectId, log, deployer: getDeployer() })
            },
        })
    },
})

async function deployFresh({ projectId, log, deployer: activeDeployer }: DeployFreshParams): Promise<ProvisionedFunction> {
    const flowVersions = await getPublishedFlowVersions({ projectId, log })
    const source = await functionSourceBuilder.build({
        projectId,
        baseSourceDir: activeDeployer.baseSourceDir,
        flowVersions,
        log,
    })
    const url = await activeDeployer.deploy({ projectId, log, source })
    return persist({ projectId, url, engineToken: activeDeployer.engineToken })
}

async function getPublishedFlowVersions({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<FlowVersion[]> {
    const page = await flowService(log).list({
        projectIds: [projectId],
        status: [FlowStatus.ENABLED],
        versionState: FlowVersionState.LOCKED,
    })
    return page.data.map((flow) => flow.version).filter((version): version is FlowVersion => !isNil(version))
}

async function persist({ projectId, url, engineToken }: { projectId: string, url: string, engineToken: string }): Promise<ProvisionedFunction> {
    const provisioned: ProvisionedFunction = { url, engineToken }
    await distributedStore.put(redisKey(projectId), provisioned, PROVISIONED_TTL_SECONDS)
    return provisioned
}

function redisKey(projectId: string): string {
    return `function:provisioned:${projectId}`
}

function lockKey(projectId: string): string {
    return `function:provision:${projectId}`
}

export type ProvisionedFunction = {
    url: string
    engineToken: string
}

export type FunctionProvisioningService = {
    ensure(params: EnsureParams): Promise<ProvisionedFunction>
    rebuild(params: EnsureParams): Promise<ProvisionedFunction>
}

type EnsureParams = {
    projectId: string
}

type DeployFreshParams = {
    projectId: string
    log: FastifyBaseLogger
    deployer: CloudFunctionDeployer
}
