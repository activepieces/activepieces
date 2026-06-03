import { AnyNode, AssignmentProperty, Identifier, MemberExpression, parse, Property } from 'acorn'
import { ancestor } from 'acorn-walk'
import { analyze } from 'eslint-scope'
/**
 * Rewrites bare step references (`step_1.foo`) into the `['output']` form
 * (`step_1['output'].foo`) for the v20 step-output schema, while leaving
 * locally-shadowed names alone (e.g. `(step_1) => step_1.bar`).
 *
 * Library reference:
 *  - ESTree AST node types (Identifier, MemberExpression, Property, …):
 *    https://github.com/estree/estree
 *  - acorn parser + acorn-walk's `ancestor` visitor:
 *    https://github.com/acornjs/acorn/blob/master/acorn-walk/README.md
 *  - eslint-scope (`analyze`, `Scope.through` for free references):
 *    https://eslint.org/docs/latest/extend/scope-manager-interface
 */

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

    const unresolvedIdentifiers  = new Set<unknown>()
    for (const ref of globalScope.through) {
        unresolvedIdentifiers .add(ref.identifier)
    }

    const rewrites: Rewrite[] = []

    ancestor(ast, {
        Identifier(node, _state, ancestors) {
            if (!isStepRef(node.name, stepNames)) {
                return
            }
            if (!unresolvedIdentifiers.has(node)) {
                return
            }
            const parent = ancestors.length >= 2 ? ancestors[ancestors.length - 2] : null
            if (!isVariableReference(node, parent)) {
                return
            }
            const start = node.start - WRAP_OFFSET
            const end = node.end - WRAP_OFFSET
            if (parent !== null && parent.type === 'Property' && parent.shorthand && parent.value === node) {
                // {step_1} ==> {step_1: {step_1}['output']}
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

    return applyRewrites(code, rewrites)
}

/**
 * Inverse of {@link rewriteStepReferences}: strips the `['output']` member that
 * the forward rewriter injected immediately after a step reference, recovering
 * the original flat expression (`step_1['output'].foo` → `step_1.foo`). Locally
 * shadowed names are left untouched, mirroring the forward pass.
 */
function unwrapStepReferences({ input, stepNames }: { input: string, stepNames: string[] }): string {
    if (!input.includes('{{')) {
        return input
    }
    const stepNameSet = new Set<string>(stepNames)
    stepNameSet.add(TRIGGER_NAME)
    return input.replace(VARIABLE_PATTERN, (match, content: string) => {
        const rewritten = unwrapToken(content, stepNameSet)
        if (rewritten === null) {
            return match
        }
        return `{{${rewritten}}}`
    })
}

function unwrapToken(code: string, stepNames: Set<string>): string | null {
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

    const unresolvedIdentifiers = new Set<unknown>()
    for (const ref of globalScope.through) {
        unresolvedIdentifiers.add(ref.identifier)
    }

    const rewrites: Rewrite[] = []

    ancestor(ast, {
        MemberExpression(node, _state, ancestors) {
            if (!isOutputMemberOfStepRef(node, stepNames, unresolvedIdentifiers)) {
                return
            }
            const objectName = (node.object as Identifier).name
            const parent = ancestors.length >= 2 ? ancestors[ancestors.length - 2] : null
            if (
                parent !== null && parent.type === 'Property' && !parent.shorthand && !parent.computed
                && parent.value === node && parent.key.type === 'Identifier' && parent.key.name === objectName
            ) {
                // inverse of `{step_1} ==> {step_1: step_1['output']}`
                rewrites.push({
                    start: parent.start - WRAP_OFFSET,
                    end: parent.end - WRAP_OFFSET,
                    text: objectName,
                })
                return
            }
            // `step_1['output']` ==> `step_1`
            rewrites.push({
                start: node.object.end - WRAP_OFFSET,
                end: node.end - WRAP_OFFSET,
                text: '',
            })
        },
    })

    return applyRewrites(code, rewrites)
}

function isOutputMemberOfStepRef(node: MemberExpression, stepNames: Set<string>, unresolvedIdentifiers: Set<unknown>): boolean {
    if (!node.computed || node.object.type !== 'Identifier') {
        return false
    }
    if (!isStepRef(node.object.name, stepNames) || !unresolvedIdentifiers.has(node.object)) {
        return false
    }
    return node.property.type === 'Literal' && node.property.value === OUTPUT_PROPERTY_NAME
}

function applyRewrites(source: string, rewrites: Rewrite[]): string {
    const ordered = [...rewrites].sort((a, b) => a.start - b.start)
    const chunks: string[] = []
    let cursor = 0
    for (const rewrite of ordered) {
        chunks.push(source.slice(cursor, rewrite.start), rewrite.text)
        cursor = rewrite.end
    }
    chunks.push(source.slice(cursor))
    return chunks.join('')
}

function isStepRef(name: string, stepNames: Set<string>): boolean {
    return STEP_NAME_PATTERN.test(name) || stepNames.has(name)
}

function isVariableReference(node: Identifier, parent: AnyNode | null): boolean {
    if (parent === null) {
        return true
    }
    switch (parent.type) {
        case 'MemberExpression':
            // `step_1.foo` → step_1 is a variable; `obj.step_1` → step_1 is just a property name.
            // Bracket access `obj[step_1]` is also a variable lookup (handled via `computed`).
            return isVariableReferenceInMemberExpression(node, parent)
        case 'Property':
            // `{ foo: step_1 }` → step_1 is a variable; `{ step_1: 42 }` → step_1 is just a key.
            // `{ step_1 }` (shorthand) and `{ [step_1]: 42 }` (computed) are variable lookups.
            return isVariableReferenceInProperty(node, parent)
        case 'MethodDefinition':
            // `class X { step_1() {} }` → step_1 is just the method name, not a variable.
            return parent.key !== node
        case 'LabeledStatement':
            // `step_1: while (true) {}` → step_1 is a label, not a variable.
            return parent.label !== node
        default:
            // Everything else (`step_1 + 1`, `f(step_1)`, `const x = step_1`, …) is a real lookup.
            return true
    }
}

function isVariableReferenceInMemberExpression(node: Identifier, parent: MemberExpression): boolean {
    if (parent.object === node) {
        return true
    }
    if (parent.property === node) {
        return parent.computed
    }
    return true
}

function isVariableReferenceInProperty(node: Identifier, parent: Property | AssignmentProperty): boolean {
    if (parent.key === node) {
        return parent.shorthand || parent.computed
    }
    return true
}

export const expressionRewriter = {
    rewriteStepReferences,
    unwrapStepReferences,
}

const VARIABLE_PATTERN = /\{\{(.*?)\}\}/g
const STEP_NAME_PATTERN = /^step_\d+$/
const TRIGGER_NAME = 'trigger'
const OUTPUT_INSERT = '[\'output\']'
const OUTPUT_PROPERTY_NAME = 'output'
const ECMA_VERSION = 2024
// Input is parsed as `(${code})` so bare expressions (e.g. `step_1.foo`) are accepted as a complete program.
// The leading `(` shifts every AST `start`/`end` position by 1 — subtract this when mapping back to `code`.
const WRAP_OFFSET = 1

type Rewrite = {
    start: number
    end: number
    text: string
}
