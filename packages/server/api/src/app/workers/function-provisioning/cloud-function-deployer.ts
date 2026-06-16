import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

const execFileAsync = promisify(execFile)
const GCLOUD_TIMEOUT_MS = 300_000

// The deployer is the only part of provisioning that touches the cloud provider. It is wrapped
// by the provisioning service (Redis cache + distributed lock), so deploy() is only ever called
// once per project across the whole cluster. describe() is the cheap "does it already exist?"
// probe used to skip a redundant deploy on a cold cache.
//
// Deploys the engine as a Cloud Functions (2nd gen) HTTP function. gen2 builds from source with
// the Node buildpack and runs functions-framework, so we point --source at the prebuilt gen2
// bundle (deploy/cloud-function-runtime/gen2/build) and --entry-point at its `engine` export.
export const cloudFunctionDeployer = {
    create(): CloudFunctionDeployer {
        const gcpProject = system.getOrThrow(AppSystemProp.FUNCTION_GCP_PROJECT)
        const region = system.get(AppSystemProp.FUNCTION_GCP_REGION) ?? 'us-central1'
        const baseSourceDir = system.getOrThrow(AppSystemProp.FUNCTION_GCP_SOURCE)
        const runtime = system.get(AppSystemProp.FUNCTION_GCP_RUNTIME) ?? 'nodejs22'
        const engineToken = system.getOrThrow(AppSystemProp.FUNCTION_ENGINE_TOKEN)
        const keyFile = system.get(AppSystemProp.FUNCTION_GCP_KEY_FILE)
        const executionMode = system.get(AppSystemProp.EXECUTION_MODE) ?? 'UNSANDBOXED'

        const gcloudEnv = {
            ...process.env,
            ...(keyFile ? { CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE: keyFile } : {}),
        }

        return {
            engineToken,
            baseSourceDir,
            async describe({ projectId }: DescribeParams): Promise<string | null> {
                const { stdout, code } = await runGcloud([
                    'functions', 'describe', serviceNameFor(projectId),
                    '--gen2', '--region', region, '--project', gcpProject,
                    '--format', 'value(serviceConfig.uri)',
                ], gcloudEnv)
                return code === 0 && stdout.length > 0 ? stdout : null
            },
            async deploy({ log, projectId, source }: DeployParams): Promise<string> {
                const functionName = serviceNameFor(projectId)
                log.info({ projectId, functionName, source }, '[functionDeployer] deploying gen2 engine function')
                const { stdout, code } = await runGcloud([
                    'functions', 'deploy', functionName,
                    '--gen2',
                    '--region', region, '--project', gcpProject,
                    '--runtime', runtime,
                    '--source', source,
                    '--entry-point', 'engine',
                    '--trigger-http',
                    '--allow-unauthenticated',
                    '--cpu', '1', '--memory', '512Mi',
                    '--min-instances', '0', '--max-instances', '20',
                    '--set-env-vars', [
                        `AP_ENGINE_TOKEN=${engineToken}`,
                        `AP_EXECUTION_MODE=${executionMode}`,
                        // The baked piece cache is transplanted under engine-cache/ (gen2 cwd is /workspace).
                        'AP_CUSTOM_PIECES_PATHS=/workspace/engine-cache',
                    ].join(','),
                    '--quiet',
                    '--format', 'value(serviceConfig.uri)',
                ], gcloudEnv)
                if (code !== 0 || stdout.length === 0) {
                    throw new ActivepiecesError({
                        code: ErrorCode.SANDBOX_INTERNAL_ERROR,
                        params: {
                            reason: `Failed to provision Cloud Functions gen2 ${functionName}`,
                            standardOutput: '',
                            standardError: stdout,
                        },
                    })
                }
                return stdout
            },
        }
    },
}

async function runGcloud(args: string[], env: NodeJS.ProcessEnv): Promise<{ stdout: string, code: number }> {
    const { data, error } = await tryCatch(() => execFileAsync('gcloud', args, { env, timeout: GCLOUD_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }))
    if (!isNil(data)) {
        return { stdout: data.stdout.trim(), code: 0 }
    }
    const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number' ? error.code : 1
    return { stdout: '', code }
}

// Cloud Run service names: lowercase letters, digits and hyphens, must start with a letter and
// be at most 63 chars. Project ids are nanoid-style tokens, so we lowercase, strip anything
// else and keep the deterministic `ap-engine-` prefix so the same project always maps to the
// same service — which is what makes "skip if it already exists" deterministic.
function serviceNameFor(projectId: string): string {
    const sanitized = projectId.toLowerCase().replace(/[^a-z0-9]/g, '')
    return `ap-engine-${sanitized}`.slice(0, 63)
}

export type CloudFunctionDeployer = {
    engineToken: string
    baseSourceDir: string
    describe(params: DescribeParams): Promise<string | null>
    deploy(params: DeployParams): Promise<string>
}

type DescribeParams = {
    projectId: string
    log: FastifyBaseLogger
}

type DeployParams = {
    projectId: string
    log: FastifyBaseLogger
    source: string
}
