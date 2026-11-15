import { z } from 'zod'

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/

function isStorableText(value: string): boolean {
    return !CONTROL_CHARACTERS.test(value) && !LONE_SURROGATE.test(value)
}

export const mcpOAuthValidation = {
    storableText(maxLength: number) {
        return z.string().max(maxLength).refine(isStorableText, {
            message: 'Control characters and unpaired surrogates are not allowed',
        })
    },
}
