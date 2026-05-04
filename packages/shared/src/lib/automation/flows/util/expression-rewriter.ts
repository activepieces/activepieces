import { AnyNode, AssignmentProperty, Identifier, MemberExpression, parse, Property } from 'acorn'
import { ancestor } from 'acorn-walk'
import { analyze } from 'eslint-scope'

function rewriteStepReferences({ input, stepNames }: { input: string, stepNames: string[] }): string {
    if (!input.includes('{{')) {
        return input
    }
    const stepNameSet = new Set<string>(stepNames)
    stepNameSet.add(TRIGGER_NAME)
    return input.replace(VARIABLE_PATTERN, (match, content: string) => {
        const rewritten = rewriteToken(content, stepNameSet)
        if (rewritten === null) {
            return match
        }
        return `{{${rewritten}}}`
    })
}

function rewriteToken(code: string, stepNames: Set<string>): string | null {
    if (code.trim().length === 0) {
        return null
    }
    let ast: AnyNode
    try {
        ast = parse(`(${code})`, { ecmaVersion: ECMA_VERSION, sourceType: 'script', ranges: true })
    }
    catch {
        return null
    }
    let scopeManager
    try {
        scopeManager = analyze(ast, { ecmaVersion: ECMA_VERSION, sourceType: 'script' })
    }
    catch {
        return null
    }

    const globalScope = scopeManager.scopes[0]
    const freeReferenceNodes = new Set<unknown>()
    for (const ref of globalScope.through) {
        freeReferenceNodes.add(ref.identifier)
    }

    const rewrites: Rewrite[] = []

    ancestor(ast, {
        Identifier(node, _state, ancestors) {
            if (!isStepRef(node.name, stepNames)) {
                return
            }
            if (!freeReferenceNodes.has(node)) {
                return
            }
            const parent = ancestors.length >= 2 ? ancestors[ancestors.length - 2] : null
            if (!isHeadPosition(node, parent)) {
                return
            }
            const start = node.start - WRAP_OFFSET
            const end = node.end - WRAP_OFFSET
            if (parent !== null && parent.type === 'Property' && parent.shorthand && parent.value === node) {
                rewrites.push({
                    start,
                    end,
                    text: `${node.name}: ${node.name}${OUTPUT_INSERT}`,
                })
                return
            }
            rewrites.push({
                start: end,
                end,
                text: OUTPUT_INSERT,
            })
        },
    })

    if (rewrites.length === 0) {
        return code
    }

    rewrites.sort((a, b) => b.start - a.start)
    let result = code
    for (const r of rewrites) {
        result = result.slice(0, r.start) + r.text + result.slice(r.end)
    }
    return result
}

function isStepRef(name: string, stepNames: Set<string>): boolean {
    return STEP_NAME_PATTERN.test(name) || stepNames.has(name)
}

function isHeadPosition(node: Identifier, parent: AnyNode | null): boolean {
    if (parent === null) {
        return true
    }
    switch (parent.type) {
        case 'MemberExpression':
            return isHeadOfMemberExpression(node, parent)
        case 'Property':
            return isHeadOfProperty(node, parent)
        case 'MethodDefinition':
            return parent.key !== node
        case 'LabeledStatement':
            return parent.label !== node
        default:
            return true
    }
}

function isHeadOfMemberExpression(node: Identifier, parent: MemberExpression): boolean {
    if (parent.object === node) {
        return true
    }
    if (parent.property === node) {
        return parent.computed
    }
    return true
}

function isHeadOfProperty(node: Identifier, parent: Property | AssignmentProperty): boolean {
    if (parent.key === node) {
        return parent.shorthand || parent.computed
    }
    return true
}

export const expressionRewriter = {
    rewriteStepReferences,
}

const VARIABLE_PATTERN = /\{\{(.*?)\}\}/g
const STEP_NAME_PATTERN = /^step_\d+$/
const TRIGGER_NAME = 'trigger'
const OUTPUT_INSERT = '[\'output\']'
const ECMA_VERSION = 2024
// Input is parsed as `(${code})` so bare expressions (e.g. `step_1.foo`) are accepted as a complete program.
// The leading `(` shifts every AST `start`/`end` position by 1 — subtract this when mapping back to `code`.
const WRAP_OFFSET = 1

type Rewrite = {
    start: number
    end: number
    text: string
}
