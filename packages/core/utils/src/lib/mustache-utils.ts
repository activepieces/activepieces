// Extracts `{{ ... }}` tokens from a string using brace depth and quote tracking
// rather than a naive regex. Expressions with nested braces (e.g. object literals
// like `{a: {x: 1}}`) or string literals containing `}}` (e.g. "ends with }}")
// are properly preserved without premature truncation at the inner `}}`.
// Every consumer that parses mentions (the engine's props-resolver and the
// flow-version expression rewriter) MUST share this so they tokenize identically —
// divergence silently breaks variable resolution.
//
// `inner` is the raw content between the braces, NOT trimmed: the rewriter
// reconstructs `{{<inner>}}` and trimming would drop a space, collapsing
// `{{ {a:1} }}` into `{{{a:1}}}` which re-tokenizes incorrectly. Callers that use
// `inner` as a variable name (the resolver) should trim it themselves.
export function extractMustacheTokens(input: string): MustacheToken[] {
    const results: MustacheToken[] = []
    let i = 0
    while (i < input.length - 1) {
        if (input[i] === '{' && input[i + 1] === '{') {
            const start = i
            let braceDepth = 0
            let inQuote: string | null = null
            i += 2
            while (i < input.length - 1 && (braceDepth > 0 || inQuote !== null || !(input[i] === '}' && input[i + 1] === '}'))) {
                const char = input[i]
                if (inQuote !== null) {
                    if (char === '\\') {
                        i += 2
                        continue
                    }
                    if (char === inQuote) {
                        inQuote = null
                    }
                    i++
                }
                else {
                    if (char === "'" || char === '"' || char === '`') {
                        inQuote = char
                        i++
                    }
                    else if (char === '{') {
                        braceDepth++
                        i++
                    }
                    else if (char === '}') {
                        if (braceDepth > 0) {
                            braceDepth--
                            i++
                        }
                        else {
                            break
                        }
                    }
                    else {
                        i++
                    }
                }
            }
            if (i < input.length - 1 && input[i] === '}' && input[i + 1] === '}' && braceDepth === 0 && inQuote === null) {
                i += 2
                const token = input.slice(start, i)
                const inner = token.slice(2, -2)
                results.push({ token, inner, index: start })
            }
        }
        else {
            i++
        }
    }
    return results
}

export type MustacheToken = {
    token: string
    inner: string
    index: number
}
