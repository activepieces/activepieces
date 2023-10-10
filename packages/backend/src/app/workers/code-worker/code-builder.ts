import fs from 'node:fs/promises'
import decompress from 'decompress'
import { PackageInfo, packageManager } from '../../helper/package-manager'

const tsConfig = `
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

async function processCodeStep({
    codeZip,
    sourceCodeId,
    buildPath,
}: {
    codeZip: Buffer
    sourceCodeId: string
    buildPath: string
}): Promise<void> {
    const codePath = `${buildPath}/codes/${sourceCodeId}`
    try {
        const tsConfigPath = `${codePath}/tsconfig.json`
        await decompress(codeZip, codePath, {})
        await addCodeDependencies(codePath)
        await fs.writeFile(tsConfigPath, tsConfig)

        await packageManager.exec({
            path: codePath,
            command: 'tsc',
        })
    }
    catch (error: unknown) {
        await handleCompilationError(codePath, error as (Error & { stdout: string }))
    }
}

async function handleCompilationError(
    buildPath: string,
    error: Error & { stdout: string },
): Promise<void> {
    const invalidArtifactTemplate = await fs.readFile(
        './packages/backend/src/assets/invalid-code.js',
    )

    const errorMessage =
    'Compilation Error: \n' + error.stdout ??
    error.message ??
    'error building code'

    const invalidArtifactFile = invalidArtifactTemplate
        .toString('utf-8')
        .replace(
            '${ERROR_MESSAGE}',
            JSON.stringify(errorMessage).replace(/"/g, '\\"'),
        )

    await fs.writeFile(`${buildPath}/index.js`, invalidArtifactFile)
}

async function addCodeDependencies(codePath: string): Promise<void> {
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
        path: codePath,
        dependencies,
    })
}

export const codeBuilder = {
    processCodeStep,
}
