import fs, { rm } from 'node:fs/promises'
import path from 'node:path'
import { cryptoUtils, fileSystemUtils, memoryLock } from '@activepieces/server-shared'
import { ExecutionMode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { CodeArtifact } from '../runner/engine-runner-types'
import { workerMachine } from '../utils/machine'
import { cacheState } from './cache-state'
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


export const codeBuilder = (log: FastifyBaseLogger) => ({
    getCodesFolder({ codesFolderPath, flowVersionId }: { codesFolderPath: string, flowVersionId: string }): string {
        return path.join(codesFolderPath, flowVersionId)
    },
    async processCodeStep({
        artifact,
        codesFolderPath,
    }: ProcessCodeStepParams): Promise<void> {
        const { sourceCode, flowVersionId, name } = artifact
        const flowVersionPath = this.getCodesFolder({ codesFolderPath, flowVersionId })
        const codePath = path.join(flowVersionPath, name)
        log.debug({
            message: 'CodeBuilder#processCodeStep',
            sourceCode,
            name,
            codePath,
        })
        const currentHash = await cryptoUtils.hashObject(sourceCode)
        const cache = cacheState(codePath)
        const cachedHash = await cache.cacheCheckState(codePath)
        if (cachedHash === currentHash) {
            return
        }

        return memoryLock.runExclusive(`code-builder-${flowVersionId}-${name}`, async () => {
            try {
                const cachedHash = await cache.cacheCheckState(codePath)
                if (cachedHash === currentHash) {
                    return
                }
                const { code, packageJson } = sourceCode

                const codeNeedCleanUp = await fileSystemUtils.fileExists(codePath)
                if (codeNeedCleanUp) {
                    await rm(codePath, { recursive: true })
                }

                await fileSystemUtils.threadSafeMkdir(codePath)


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

                await cache.setCache(codePath, currentHash)
            }
            catch (error: unknown) {
                log.error({ name: 'CodeBuilder#processCodeStep', codePath, error })

                await handleCompilationError({
                    codePath,
                    error,
                })
            }
        })
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
            spec: '4.9.4',
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
    const errorHasStdout = typeof error === 'object' && error && 'stdout' in error
    const stdoutError = errorHasStdout ? error.stdout : undefined
    const genericError = `${error ?? 'error compiling'}`
    const errorMessage = `Compilation Error ${stdoutError ?? genericError}`

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
    error: unknown
}
