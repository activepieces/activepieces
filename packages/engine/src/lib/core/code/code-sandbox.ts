import { CodeSandboxType } from '@activepieces/shared'
import { CodeSandbox } from '../../core/code/code-sandbox-common'
import { v8IsolateCodeSandbox } from './v8-isolate-code-sandbox'
import { noOpCodeSandbox } from './no-op-code-sandbox'

const CODE_SANDBOX_TYPE =
    (process.env.AP_CODE_SANDBOX_TYPE as CodeSandboxType | undefined)
    ?? CodeSandboxType.NO_OP

const getCodeSandbox = (): CodeSandbox => {
    const variants = new Map([
        [CodeSandboxType.NO_OP, noOpCodeSandbox],
        [CodeSandboxType.V8_ISOLATE, v8IsolateCodeSandbox],
    ])

    return variants.get(CODE_SANDBOX_TYPE) ?? noOpCodeSandbox
}

export const codeSandbox = getCodeSandbox()
