import fs, { rmdir } from 'node:fs/promises'
import path from 'node:path'
import { fileExists, memoryLock, threadSafeMkdir } from '@activepieces/server-shared'
import { ExecutionMode, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { CodeArtifact } from '../engine/engine-runner'
import { cacheHandler } from '../utils/cache-handler'
import { workerMachine } from './machine'
import { PackageInfo, packageManager } from './package-manager'

const TS_CONFIG_CONTENT = `

{
    "extends": "@tsconfig/node18/tsconfig.json",
    "compilerOptions": {
        "lib": ["es2022", "dom"],
        "skipLibCheck": true,
        "noUnusedLocals": false,
        "noUnusedParameters": false,
        "strict": false,
        "strictPropertyInitialization": false,
        "strictNullChecks": false,
        "strictFunctionTypes": false,
        "strictBindCallApply": false,
        "noImplicitAny": false,
        "noImplicitThis": false,
        "noImplicitReturns": false,
        "noFallthroughCasesInSwitch": false
    }
}
`

const INVALID_ARTIFACT_TEMPLATE = `
    exports.code = async (params) => {
      throw new Error(\`\${ERROR_MESSAGE}\`);
    };
    `

const INVALID_ARTIFACT_ERROR_PLACEHOLDER = '${ERROR_MESSAGE}'


enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}

export const codeBuilder = (log: FastifyBaseLogger) => ({
    getCodesFolder({ codesFolderPath, flowVersionId }: { codesFolderPath: string, flowVersionId: string }): string {
        return path.join(codesFolderPath, flowVersionId)
    },
    async processCodeStep({
        artifact,
        codesFolderPath,
        runEnvironment,
    }: ProcessCodeStepParams): Promise<void> {
        const { sourceCode, flowVersionId, name } = artifact
        const flowVersionPath = this.getCodesFolder({ codesFolderPath, flowVersionId })
        const codePath = path.join(flowVersionPath, name, runEnvironment.toString())
        log.debug({
            message: 'CodeBuilder#processCodeStep',
            sourceCode,
            name,
            codePath,
        })

        const lock = await memoryLock.acquire(`code-builder-${flowVersionId}-${name}-${runEnvironment}`)
        try {
            const cache = cacheHandler(codePath)
            const fState = await cache.cacheCheckState(codePath)
            if (fState === CacheState.READY && artifact.flowVersionState === FlowVersionState.LOCKED) {
                return
            }
            const { code, packageJson } = sourceCode

            const codeNeedCleanUp = fState === CacheState.PENDING && await fileExists(codePath)
            if (codeNeedCleanUp) {
                await rmdir(codePath, { recursive: true })
            }

            await threadSafeMkdir(codePath)


            await cache.setCache(codePath, CacheState.PENDING)

            const isPackagesAllowed = workerMachine.getSettings().EXECUTION_MODE !== ExecutionMode.SANDBOX_CODE_ONLY

            await installDependencies({
                path: codePath,
                packageJson: isPackagesAllowed ? packageJson : '{"dependencies":{}}',
                log,
            })

            await compileCode({
                path: codePath,
                code,
                log,
            })

            await cache.setCache(codePath, CacheState.READY)
        }
        catch (error: unknown) {
            log.error({ name: 'CodeBuilder#processCodeStep', codePath, error })

            await handleCompilationError({
                codePath,
                error: error as Record<string, string | undefined>,
            })
        }
        finally {
            await lock.release()
        }
    },
})

const installDependencies = async ({
    path,
    packageJson,
    log,
}: InstallDependenciesParams): Promise<void> => {
    await fs.writeFile(`${path}/package.json`, packageJson, 'utf8')

    const dependencies: PackageInfo[] = [
        {
            alias: '@tsconfig/node18',
            spec: '1.0.0',
        },
        {
            alias: '@types/node',
            spec: '18.17.1',
        },
        {
            alias: 'typescript',
            spec: '4.8.4',
        },
    ]

    await packageManager(log).add({
        path,
        dependencies,
    })
}

const compileCode = async ({
    path,
    code,
    log,
}: CompileCodeParams): Promise<void> => {
    await fs.writeFile(`${path}/tsconfig.json`, TS_CONFIG_CONTENT, { encoding: 'utf8', flag: 'w' })
    await fs.writeFile(`${path}/index.ts`, code, { encoding: 'utf8', flag: 'w' })

    await packageManager(log).exec({
        path,
        command: 'tsc',
    })
}

const handleCompilationError = async ({
    codePath,
    error,
}: HandleCompilationErrorParams): Promise<void> => {
    const errorMessage = `Compilation Error: ${JSON.stringify(error['stdout']) ?? JSON.stringify(error) ?? 'error compiling code'}`

    const invalidArtifactContent = INVALID_ARTIFACT_TEMPLATE.replace(
        INVALID_ARTIFACT_ERROR_PLACEHOLDER,
        errorMessage,
    )

    await fs.writeFile(`${codePath}/index.js`, invalidArtifactContent, 'utf8')
}


type ProcessCodeStepParams = {
    artifact: CodeArtifact
    codesFolderPath: string
    log: FastifyBaseLogger
    runEnvironment: RunEnvironment
}

type InstallDependenciesParams = {
    path: string
    packageJson: string
    log: FastifyBaseLogger
}

type CompileCodeParams = {
    path: string
    code: string
    log: FastifyBaseLogger
}

type HandleCompilationErrorParams = {
    codePath: string
    error: Record<string, string | undefined>
}