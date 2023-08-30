import fs from 'node:fs/promises'
import decompress from 'decompress'
import {
    packageManager,
    PackageManagerDependencies,
} from '../../helper/package-manager'

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
        await packageManager.runLocalDependency(codePath, 'tsc')
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
    const dependencies: PackageManagerDependencies = {
        '@tsconfig/node18': {
            version: '1.0.0',
        },
        '@types/node': {
            version: '18.17.1',
        },
        typescript: {
            version: '4.8.4',
        },
    }
    await packageManager.addDependencies(codePath, dependencies)
}

export const codeBuilder = {
    processCodeStep,
}
