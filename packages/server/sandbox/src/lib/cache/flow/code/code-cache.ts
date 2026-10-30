import path from 'node:path'
import { assertSafeCodeNamespace, assertSafePathSegment } from '../../../utils/path-safety'

const STEP_ENTRY_FILENAME = 'index.ts'
// esbuild output for legacy (useDeno=false) steps: a self-contained CJS bundle with dependencies inlined.
const COMPILED_CODE_FILENAME = 'index.js'
// sucrase output for deno (useDeno=true) steps: CJS with imports rewritten to require(), resolved from node_modules at runtime.
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
