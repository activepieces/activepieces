import fs from 'node:fs/promises'
import { logger, PackageInfo, packageManager } from '@activepieces/server-shared'
import { SourceCode } from '@activepieces/shared'

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

const INVALID_ARTIFACT_TEMPLATE_PATH =
    './packages/server/api/src/assets/invalid-code.js'

const INVALID_ARTIFACT_ERROR_PLACEHOLDER = '${ERROR_MESSAGE}'

export const codeBuilder = {
    async processCodeStep({
        sourceCode,
        sourceCodeId,
        buildPath,
    }: ProcessCodeStepParams): Promise<void> {
        logger.debug({
            name: 'CodeBuilder#processCodeStep',
            sourceCode,
            sourceCodeId,
            buildPath,
        })

        const codePath = `${buildPath}/codes/${sourceCodeId}`

        try {
            const { code, packageJson } = sourceCode

            await createBuildDirectory(codePath)

            await installDependencies({
                path: codePath,
                packageJson,
            })

            await compileCode({
                path: codePath,
                code,
            })
        }
        catch (error: unknown) {
            logger.error({ name: 'CodeBuilder#processCodeStep', codePath, error })

            await handleCompilationError({
                codePath,
                error: error as Record<string, string | undefined>,
            })
        }
    },
}

const createBuildDirectory = async (path: string): Promise<void> => {
    await fs.mkdir(path, { recursive: true })
}

const installDependencies = async ({
    path,
    packageJson,
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

    await packageManager.add({
        path,
        dependencies,
    })
}

const compileCode = async ({
    path,
    code,
}: CompileCodeParams): Promise<void> => {
    await fs.writeFile(`${path}/tsconfig.json`, TS_CONFIG_CONTENT, 'utf8')
    await fs.writeFile(`${path}/index.ts`, code, 'utf8')

    await packageManager.exec({
        path,
        command: 'tsc',
    })
}

const handleCompilationError = async ({
    codePath,
    error,
}: HandleCompilationErrorParams): Promise<void> => {
    const invalidArtifactTemplate = await fs.readFile(
        INVALID_ARTIFACT_TEMPLATE_PATH,
        'utf8',
    )

    const errorMessage = `Compilation Error:\n${JSON.stringify(error) ?? 'error building code'}`

    const invalidArtifactContent = invalidArtifactTemplate.replace(
        INVALID_ARTIFACT_ERROR_PLACEHOLDER,
        JSON.stringify(errorMessage),
    )

    await fs.writeFile(`${codePath}/index.js`, invalidArtifactContent, 'utf8')
}

type ProcessCodeStepParams = {
    sourceCode: SourceCode
    sourceCodeId: string
    buildPath: string
}

type InstallDependenciesParams = {
    path: string
    packageJson: string
}

type CompileCodeParams = {
    path: string
    code: string
}

type HandleCompilationErrorParams = {
    codePath: string
    error: Record<string, string | undefined>
}
