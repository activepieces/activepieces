import path from 'node:path'
import { assertSafeCodeNamespace, assertSafePathSegment } from '../../../utils/path-safety'

const STEP_ENTRY_FILENAME = 'index.ts'
// Only removed on rebuilds: esbuild output of pre-deno builds, kept so stale caches rebuild cleanly.
const COMPILED_CODE_FILENAME = 'index.js'
// sucrase output: CJS with imports rewritten to require(), resolved from node_modules at runtime.
const TRANSPILED_CODE_FILENAME = 'index.cjs'

export const codeCache = (codesFolderPath: string) => ({
    flowVersionDir(flowVersionId: string): string {
        assertSafeCodeNamespace(flowVersionId)
        return path.join(codesFolderPath, flowVersionId)
    },

    stepDir({ flowVersionId, stepName }: StepRef): string {
        assertSafeCodeNamespace(flowVersionId)
        assertSafePathSegment(stepName, 'stepName')
        return path.join(codesFolderPath, flowVersionId, stepName)
    },

    stepEntryPath(ref: StepRef): string {
        return path.join(this.stepDir(ref), STEP_ENTRY_FILENAME)
    },

    compiledStepPath(ref: StepRef): string {
        return path.join(this.stepDir(ref), COMPILED_CODE_FILENAME)
    },

    transpiledStepPath(ref: StepRef): string {
        return path.join(this.stepDir(ref), TRANSPILED_CODE_FILENAME)
    },
})

type StepRef = {
    flowVersionId: string
    stepName: string
}
