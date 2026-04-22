import { ContextVersion } from '@activepieces/pieces-framework'
import { AP_FUNCTIONS, applyFunctionToValues, evaluateExpression, isNil, isString } from '@activepieces/shared'

import { initCodeSandbox } from '../core/code/code-sandbox'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createConnectionResolver } from '../piece-context/connection-resolver'
import { utils } from '../utils'

const VARIABLE_PATTERN = /\{\{(.*?)\}\}/g
const CONNECTIONS = 'connections'
const FLATTEN_NESTED_KEYS_PATTERN = /\{\{\s*flattenNestedKeys(.*?)\}\}/g


export const createPropsResolver = ({ engineToken, projectId, apiUrl, contextVersion, stepNames }: PropsResolverParams) => {
    return {
        resolve: async <T = unknown>(params: ResolveInputParams): Promise<ResolveResult<T>> => {
            const { unresolvedInput, executionState } = params
            if (isNil(unresolvedInput)) {
                return {
                    resolvedInput: unresolvedInput as T,
                    censoredInput: unresolvedInput,
                }
            }
            const referencedStepNames = extractReferencedStepNames(unresolvedInput, stepNames)
            const currentState = executionState.currentState(Array.from(referencedStepNames))
            const resolveOptions = {
                engineToken,
                projectId,
                apiUrl,
                currentState,
            }
            const resolvedInput = await applyFunctionToValues<T>(
                unresolvedInput,
                (token) => resolveInputAsync({
                    ...resolveOptions,
                    input: token,
                    censoredInput: false,
                    contextVersion,
                }))
            const censoredInput = await applyFunctionToValues<T>(
                unresolvedInput,
                (token) => resolveInputAsync({
                    ...resolveOptions,
                    input: token,
                    censoredInput: true,
                    contextVersion,
                }))
            return {
                resolvedInput,
                censoredInput,
            }
        },
    }
}

const mergeFlattenedKeysArraysIntoOneArray = async (token: string, partsThatNeedResolving: string[],
    resolveOptions: Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'currentState' | 'censoredInput'>,
    contextVersion: ContextVersion | undefined,
) => {
    const resolvedValues: Record<string, unknown> = {}
    let longestResultLength = 0
    for (const tokenPart of partsThatNeedResolving) {
        const variableName = tokenPart.substring(2, tokenPart.length - 2)
        resolvedValues[tokenPart] = await resolveSingleToken({
            ...resolveOptions,
            variableName,
            contextVersion,
        })
        if (Array.isArray(resolvedValues[tokenPart])) {
            longestResultLength = Math.max(longestResultLength, resolvedValues[tokenPart].length)
        }
    }
    const result = new Array(longestResultLength).fill(null).map((_, index) => {
        return Object.entries(resolvedValues).reduce((acc, [tokenPart, value]) => {
            const valueToUse = (Array.isArray(value) ? value[index] : value) ?? ''
            acc = acc.replace(tokenPart, isString(valueToUse) ? valueToUse : JSON.stringify(valueToUse))
            return acc
        }, token)
    })
    return result
}

export type PropsResolver = ReturnType<typeof createPropsResolver>

function extractReferencedStepNames(input: unknown, stepNames: string[]): Set<string> {
    const stringifiedInput = JSON.stringify(input)
    const referencedSteps = new Set<string>()
    for (const stepName of stepNames) {
        if (stringifiedInput.includes(stepName)) {
            referencedSteps.add(stepName)
        }
    }
    return referencedSteps
}

/** 
 * input: `Hello {{firstName}} {{lastName}}`
 * tokenThatNeedResolving: [`{{firstName}}`, `{{lastName}}`]
 */
async function resolveInputAsync(params: ResolveInputInternalParams): Promise<unknown> {
    const { input, currentState, engineToken, projectId, apiUrl, censoredInput } = params

    if (isFormulaExpression(input)) {
        const resolveOptions = { engineToken, projectId, apiUrl, currentState, censoredInput, contextVersion: params.contextVersion }
        const { expression: preResolvedExpr, vars: preResolvedVars } = await preResolveFormulaVars(input, resolveOptions)
        const { result, error } = evaluateExpression(preResolvedExpr, preResolvedVars)
        if (error) {
            // Don't silently swallow the value — preserve the original input so user data
            // that happens to resemble a formula (e.g. `min(qty, limit) reached`) is not lost.
            console.warn('[resolveInputAsync] Formula evaluation error:', error)
            return input
        }
        return result ?? ''
    }

    const tokensThatNeedResolving = input.match(VARIABLE_PATTERN)
    const inputContainsOnlyOneTokenToResolve = tokensThatNeedResolving !== null && tokensThatNeedResolving.length === 1 && tokensThatNeedResolving[0] === input
    const resolveOptions = {
        engineToken,
        projectId,
        apiUrl,
        currentState,
        censoredInput,
    }

    if (inputContainsOnlyOneTokenToResolve) {
        const trimmedInput = input.trim()
        const variableName = trimmedInput.substring(2, trimmedInput.length - 2)
        return resolveSingleToken({
            ...resolveOptions,
            variableName,
            contextVersion: params.contextVersion,
        })
    }
    const inputIncludesFlattenNestedKeysTokens = input.match(FLATTEN_NESTED_KEYS_PATTERN)
    if (!isNil(inputIncludesFlattenNestedKeysTokens) && !isNil(tokensThatNeedResolving)) {
        return mergeFlattenedKeysArraysIntoOneArray(input, tokensThatNeedResolving, resolveOptions, params.contextVersion)
    }

    return stringReplaceAsync(input, VARIABLE_PATTERN, async (_fullMatch, variableName) => {
        const result = await resolveSingleToken({
            ...resolveOptions,
            variableName,
            contextVersion: params.contextVersion,
        })
        return isString(result) ? result : JSON.stringify(result)
    })
}

async function resolveSingleToken(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, currentState } = params
    const isConnection = variableName.startsWith(CONNECTIONS)
    if (isConnection) {
        return handleConnection(params)
    }
    return evalInScope(variableName, { ...currentState }, { flattenNestedKeys })
}

async function handleConnection(params: ResolveSingleTokenParams): Promise<unknown> {
    const { variableName, engineToken, projectId, apiUrl, censoredInput } = params
    const connectionName = parseConnectionNameOnly(variableName)
    if (isNil(connectionName)) {
        return ''
    }
    if (censoredInput) {
        return '**REDACTED**'
    }
    const connection = await createConnectionResolver({ engineToken, projectId, apiUrl, contextVersion: params.contextVersion }).obtain(connectionName)
    const pathAfterConnectionName = parsePathAfterConnectionName(variableName, connectionName)
    if (isNil(pathAfterConnectionName) || pathAfterConnectionName.length === 0) {
        return connection
    }
    return evalInScope(pathAfterConnectionName, { connection }, { flattenNestedKeys })
}

function parsePathAfterConnectionName(variableName: string, connectionName: string): string | null {
    if (variableName.includes('[')) {
        return variableName.substring(`connections.['${connectionName}']`.length)
    }
    const cp = variableName.substring(`connections.${connectionName}`.length)
    if (cp.length === 0) {
        return cp
    }
    return `connection${cp}`
}

function parseConnectionNameOnly(variableName: string): string | null {
    const connectionWithNewFormatSquareBrackets = variableName.includes('[')
    if (connectionWithNewFormatSquareBrackets) {
        return parseSquareBracketConnectionPath(variableName)
    }
    // {{connections.connectionName.path}}
    // This does not work If connectionName contains .
    return variableName.split('.')?.[1]
}

function parseSquareBracketConnectionPath(variableName: string): string | null {
    // Find the connection name inside {{connections['connectionName'].path}}
    const matches = variableName.match(/\['([^']+)'\]/g)
    if (matches && matches.length >= 1) {
        // Remove the square brackets and quotes from the connection name

        const secondPath = matches[0].replace(/\['|'\]/g, '')
        return secondPath
    }
    return null
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function evalInScope(js: string, contextAsScope: Record<string, unknown>, functions: Record<string, Function>): Promise<unknown> {
    const { data: result, error: resultError } = await utils.tryCatchAndThrowOnEngineError((async () => {
        const codeSandbox = await initCodeSandbox()

        const result = await codeSandbox.runScript({
            script: js,
            scriptContext: contextAsScope,
            functions,
        })
        return result ?? ''
    }))

    if (resultError) {
        console.warn('[evalInScope] Error evaluating variable', resultError)
        return ''
    }
    return result ?? ''
}

function flattenNestedKeys(data: unknown, pathToMatch: string[]): unknown[] {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
            if (key === pathToMatch[0]) {
                return flattenNestedKeys(value, pathToMatch.slice(1))
            }
        }
    }
    else if (Array.isArray(data)) {
        return data.flatMap((d) => flattenNestedKeys(d, pathToMatch))
    }
    else if (pathToMatch.length === 0) {
        return [data]
    }
    return []
}

type PreResolveOptions = Pick<ResolveInputInternalParams, 'engineToken' | 'projectId' | 'apiUrl' | 'currentState' | 'censoredInput' | 'contextVersion'>

async function preResolveFormulaVars(
    expression: string,
    resolveOptions: PreResolveOptions,
): Promise<{ expression: string, vars: Record<string, unknown> }> {
    const tokenPattern = /\{\{([^}]+)\}\}/g
    const matches: Array<{ original: string, variableName: string, key: string }> = []
    let idx = 0
    let match
    while ((match = tokenPattern.exec(expression)) !== null) {
        matches.push({ original: match[0], variableName: match[1].trim(), key: `__ap_pv${idx++}__` })
    }

    const vars: Record<string, unknown> = {}
    await Promise.all(matches.map(async ({ variableName, key }) => {
        vars[key] = await resolveSingleToken({ variableName, ...resolveOptions })
    }))

    let rewritten = expression
    for (const { original, key } of matches) {
        rewritten = rewritten.split(original).join(`{{${key}}}`)
    }

    return { expression: rewritten, vars }
}

const AP_FUNCTION_NAMES = new Set(AP_FUNCTIONS.map((fn) => fn.name))
const AP_FUNCTION_CALL_REGEX = new RegExp(
    `(?<!\\.)\\b(${AP_FUNCTIONS.map((fn) => fn.name).join('|')})\\s*\\(`,
)

/**
 * Detect whether the input is an AP formula expression.
 *
 * Function names like `min`, `trim`, `round`, `replace`, `contains` collide with
 * common words, so a bare name-match would false-positive on arbitrary user data
 * (e.g. `"min(qty, limit) reached"`, `"Please trim(spaces)"`). We require:
 *
 * 1. A known function name followed by `(`.
 * 2. A matching closing `)` (balanced parens, string-delimiter aware).
 * 3. Multi-argument calls use `;` as the separator (AP formula syntax). Natural
 *    language uses `,` as the English list separator, so a top-level `,` inside
 *    the parens is a strong signal this is NOT a formula.
 */
function isFormulaExpression(input: string): boolean {
    if (!AP_FUNCTION_CALL_REGEX.test(input)) return false

    let pos = 0
    while (pos < input.length) {
        const next = findNextApFunctionCall(input, pos)
        if (next === null) return false

        const closePos = findMatchingParen(input, next.openParen)
        if (closePos === -1) {
            pos = next.openParen + 1
            continue
        }

        const argsContent = input.slice(next.openParen + 1, closePos)
        if (!hasTopLevelComma(argsContent)) return true

        pos = closePos + 1
    }
    return false
}

function findNextApFunctionCall(text: string, fromPos: number): { start: number, openParen: number } | null {
    for (let i = fromPos; i < text.length; i++) {
        if (!/[a-z_]/i.test(text[i])) continue
        if (i > 0 && text[i - 1] === '.') continue
        const wordMatch = text.slice(i).match(/^([a-z_][a-z0-9_]*)\s*\(/i)
        if (wordMatch && AP_FUNCTION_NAMES.has(wordMatch[1])) {
            return { start: i, openParen: i + wordMatch[0].length - 1 }
        }
    }
    return null
}

function findMatchingParen(text: string, openPos: number): number {
    let depth = 0
    let inString: '"' | '\'' | null = null
    for (let i = openPos; i < text.length; i++) {
        const ch = text[i]
        if (inString) {
            if (ch === inString && text[i - 1] !== '\\') inString = null
        }
        else if (ch === '"' || ch === '\'') {
            inString = ch
        }
        else if (ch === '(') {
            depth++
        }
        else if (ch === ')') {
            depth--
            if (depth === 0) return i
        }
    }
    return -1
}

function hasTopLevelComma(content: string): boolean {
    let depth = 0
    let inString: '"' | '\'' | null = null
    for (let i = 0; i < content.length; i++) {
        const ch = content[i]
        if (inString) {
            if (ch === inString && content[i - 1] !== '\\') inString = null
            continue
        }
        if (ch === '"' || ch === '\'') {
            inString = ch
        }
        else if (ch === '(' || ch === '[') {
            depth++
        }
        else if (ch === ')' || ch === ']') {
            depth--
        }
        else if (ch === ',' && depth === 0) {
            return true
        }
    }
    return false
}

type ResolveSingleTokenParams = {
    variableName: string
    currentState: Record<string, unknown>
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    contextVersion: ContextVersion | undefined
}

type ResolveInputInternalParams = {
    input: string
    engineToken: string
    projectId: string
    apiUrl: string
    censoredInput: boolean
    currentState: Record<string, unknown>
    contextVersion: ContextVersion | undefined
}

type ResolveInputParams = {
    unresolvedInput: unknown
    executionState: FlowExecutorContext
}

type ResolveResult<T = unknown> = {
    resolvedInput: T
    censoredInput: unknown
}

async function stringReplaceAsync(str: string, regex: RegExp, replacer: (...args: string[]) => Promise<string>): Promise<string> {
    const matches: { match: string, groups: string[], index: number }[] = []
    str.replace(regex, (match, ...args) => {
        const groups = args.slice(0, -2) as string[]
        const index = args[args.length - 2] as unknown as number
        matches.push({ match, groups, index })
        return match
    })
    let result = ''
    let lastIndex = 0
    for (const { match, groups, index } of matches) {
        result += str.slice(lastIndex, index)
        result += await replacer(match, ...groups)
        lastIndex = index + match.length
    }
    result += str.slice(lastIndex)
    return result
}

type PropsResolverParams = {
    engineToken: string
    projectId: string
    apiUrl: string
    contextVersion: ContextVersion | undefined
    stepNames: string[]
}