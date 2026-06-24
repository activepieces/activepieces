import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { type ApLogger, safeHttp } from '@activepieces/server-utils'
import { GoogleAuth } from 'google-auth-library'

const RUN_API = 'https://run.googleapis.com/v2'
const GCP_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const DEPLOY_POLL_INTERVAL_MS = 4000
const DEPLOY_TIMEOUT_MS = 6 * 60 * 1000

async function resolveAuth(): Promise<{ accessToken: string, projectId: string }> {
    const auth = new GoogleAuth({ scopes: [GCP_SCOPE] })
    const [accessToken, projectId] = await Promise.all([auth.getAccessToken(), auth.getProjectId().catch(() => undefined)])
    if (isNil(accessToken) || isNil(projectId)) {
        throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: 'Failed to resolve GCP application default credentials (access token / project id)' } })
    }
    return { accessToken, projectId }
}

function buildServiceSpec({ image, token, cacheBasePath, timeoutSeconds }: BuildSpecParams): Record<string, unknown> {
    return {
        template: {
            executionEnvironment: 'EXECUTION_ENVIRONMENT_GEN2',
            maxInstanceRequestConcurrency: 1,
            timeout: `${timeoutSeconds}s`,
            scaling: { maxInstanceCount: 4 },
            containers: [{
                image,
                ports: [{ containerPort: 8080 }],
                resources: { limits: { cpu: '1', memory: '1Gi' }, cpuIdle: true },
                env: [
                    { name: 'AP_POOL_SERVER_TOKEN', value: token },
                    { name: 'AP_CACHE_BASE_PATH', value: cacheBasePath },
                ],
            }],
        },
        ingress: 'INGRESS_TRAFFIC_ALL',
    }
}

async function pollOperation({ operationName, authHeader, log }: PollParams): Promise<void> {
    const deadline = Date.now() + DEPLOY_TIMEOUT_MS
    while (Date.now() < deadline) {
        const { data } = await safeHttp.axios.get<RunOperation>(`${RUN_API}/${operationName}`, { headers: authHeader })
        if (data.done === true) {
            if (!isNil(data.error)) {
                throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: `Cloud Run deploy failed: ${JSON.stringify(data.error)}` } })
            }
            return
        }
        log.info({ operationName }, 'Waiting for Cloud Run pool server deploy')
        await new Promise((resolve) => setTimeout(resolve, DEPLOY_POLL_INTERVAL_MS))
    }
    throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: 'Timed out waiting for Cloud Run pool server deploy' } })
}

async function allowUnauthenticated({ serviceUrl, authHeader }: { serviceUrl: string, authHeader: Record<string, string> }): Promise<void> {
    const policy = { policy: { bindings: [{ role: 'roles/run.invoker', members: ['allUsers'] }] } }
    await safeHttp.axios.post(`${serviceUrl}:setIamPolicy`, policy, { headers: authHeader })
}

async function ensureService({ region, serviceName, image, token, cacheBasePath, timeoutSeconds, log }: EnsureServiceParams): Promise<string> {
    const { accessToken, projectId } = await resolveAuth()
    const authHeader = { Authorization: `Bearer ${accessToken}` }
    const serviceUrl = `${RUN_API}/projects/${projectId}/locations/${region}/services/${serviceName}`

    const existing = await safeHttp.axios.get<RunService>(serviceUrl, { headers: authHeader }).then((res) => res.data).catch(() => undefined)
    const deployedImage = existing?.template?.containers?.[0]?.image
    const alreadyDeployed = !isNil(existing?.uri) && deployedImage === image

    if (!alreadyDeployed) {
        log.info({ serviceName, image }, 'Provisioning Cloud Run pool server')
        const spec = buildServiceSpec({ image, token, cacheBasePath, timeoutSeconds })
        const { data: operation } = await safeHttp.axios.patch<RunOperation>(`${serviceUrl}?allowMissing=true`, spec, { headers: authHeader })
        if (!isNil(operation.name)) {
            await pollOperation({ operationName: operation.name, authHeader, log })
        }
        await allowUnauthenticated({ serviceUrl, authHeader })
    }

    const { data: service } = await safeHttp.axios.get<RunService>(serviceUrl, { headers: authHeader })
    if (isNil(service?.uri)) {
        throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: 'Cloud Run pool server has no URI after deploy' } })
    }
    log.info({ serviceName, uri: service.uri, reused: alreadyDeployed }, 'Cloud Run pool server ready')
    return service.uri
}

export const cloudRunProvisioner = {
    ensureService,
}

type BuildSpecParams = {
    image: string
    token: string
    cacheBasePath: string
    timeoutSeconds: number
}

type PollParams = {
    operationName: string
    authHeader: Record<string, string>
    log: ApLogger
}

type EnsureServiceParams = {
    region: string
    serviceName: string
    image: string
    token: string
    cacheBasePath: string
    timeoutSeconds: number
    log: ApLogger
}

type RunOperation = {
    name?: string
    done?: boolean
    error?: unknown
}

type RunService = {
    uri?: string
    template?: { containers?: Array<{ image?: string }> }
}
