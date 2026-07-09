import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileSystemUtils } from '@activepieces/server-utils'

const COMPILED_CODE_FILENAME = 'index.js'

export const codeCache = (codesFolderPath: string) => ({
    flowVersionDir(flowVersionId: string): string {
        return path.join(codesFolderPath, flowVersionId)
    },

    stepDir({ flowVersionId, stepName }: StepRef): string {
        return path.join(codesFolderPath, flowVersionId, stepName)
    },

    compiledStepPath(ref: StepRef): string {
        return path.join(this.stepDir(ref), COMPILED_CODE_FILENAME)
    },

    async readCompiledStep(ref: StepRef): Promise<string> {
        return readFile(this.compiledStepPath(ref), 'utf8')
    },

    async writeCompiledStep({ flowVersionId, stepName, compiledJs }: WriteStepParams): Promise<void> {
        await fileSystemUtils.threadSafeMkdir(this.stepDir({ flowVersionId, stepName }))
        await writeFile(this.compiledStepPath({ flowVersionId, stepName }), compiledJs, 'utf8')
    },
})

type StepRef = {
    flowVersionId: string
    stepName: string
}

type WriteStepParams = StepRef & {
    compiledJs: string
}
