// Extracts `{{ ... }}` tokens from a string using brace counting rather than a
// regex. A naive /\{\{(.*?)\}\}/ stops at the first `}}` it sees, so expressions
// with nested braces (object literals, function calls) or string literals that
// contain `}}` get truncated. Every consumer that parses mentions (the engine's
// props-resolver and the flow-version expression rewriter) MUST share this so
// they tokenize identically — divergence silently breaks variable resolution.
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
            let depth = 1
            i += 2
            while (i < input.length - 1 && depth > 0) {
                if (input[i] === '{' && input[i + 1] === '{') {
                    depth++; i += 2
                }
                else if (input[i] === '}' && input[i + 1] === '}') {
                    depth--; i += 2
                }
                else {
                    i++
                }
            }
            if (depth === 0) {
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
