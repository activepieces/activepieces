import { deno } from '@activepieces/core-utils'
import { SUCRASE_SOURCE } from './sucrase-source'

const TRANSPILE_MEMORY_LIMIT_MB = 64
const TRANSPILE_TIMEOUT_MS = 10_000

export const denoStepTranspiler = {
    async toCommonJs({ source }: ToCommonJsParams): Promise<TranspileResult> {
        const result = await deno.run({
            body: `
${SUCRASE_SOURCE}
    const transformed = globalThis.__apSucrase.transform(${JSON.stringify(source)}, {
        transforms: ['typescript', 'imports'],
        disableESTransforms: true,
        production: true,
    }).code.replace(/^"use strict";/, '');
    let result;
    try {
        new Function(transformed);
        result = { code: transformed };
    }
    catch {
        result = { fallbackToEsm: true };
    }
`,
            permissions: [],
            memoryLimitMb: TRANSPILE_MEMORY_LIMIT_MB,
            timeoutMs: TRANSPILE_TIMEOUT_MS,
        })
        if (!isTranspileResult(result)) {
            throw new Error('Deno transpiler returned an unexpected result')
        }
        return result
    },
}

function isTranspileResult(value: unknown): value is TranspileResult {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    if ('fallbackToEsm' in value && value.fallbackToEsm === true) {
        return true
    }
    return 'code' in value && typeof value.code === 'string'
}

type ToCommonJsParams = {
    source: string
}

export type TranspileResult = {
    code: string
    fallbackToEsm?: undefined
} | {
    code?: undefined
    fallbackToEsm: true
}
