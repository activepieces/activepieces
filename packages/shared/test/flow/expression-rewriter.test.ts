import { describe, expect, it } from 'vitest'
import { expressionRewriter } from '../../src'

const rewrite = (input: string, stepNames: string[] = []): string =>
    expressionRewriter.rewriteStepReferences({ input, stepNames })

describe('expressionRewriter.rewriteStepReferences', () => {
    describe('A. Basic access patterns', () => {
        it('A1. bare reference', () => {
            expect(rewrite('{{step_1}}')).toBe('{{step_1[\'output\']}}')
        })
        it('A2. dot access', () => {
            expect(rewrite('{{step_1.foo}}')).toBe('{{step_1[\'output\'].foo}}')
        })
        it('A3. bracket single quotes', () => {
            expect(rewrite('{{step_1[\'foo\']}}')).toBe('{{step_1[\'output\'][\'foo\']}}')
        })
        it('A4. bracket double quotes', () => {
            expect(rewrite('{{step_1["foo"]}}')).toBe('{{step_1[\'output\']["foo"]}}')
        })
        it('A5. numeric index', () => {
            expect(rewrite('{{step_1[0]}}')).toBe('{{step_1[\'output\'][0]}}')
        })
        it('A6. computed bracket with variable', () => {
            expect(rewrite('{{step_1[someVar]}}')).toBe('{{step_1[\'output\'][someVar]}}')
        })
        it('A7. mixed dot+bracket chain', () => {
            expect(rewrite('{{step_1.foo[\'bar\'][0].baz}}')).toBe('{{step_1[\'output\'].foo[\'bar\'][0].baz}}')
        })
        it('A8. optional chaining dot', () => {
            expect(rewrite('{{step_1?.foo}}')).toBe('{{step_1[\'output\']?.foo}}')
        })
        it('A9. optional chaining bracket', () => {
            expect(rewrite('{{step_1?.[\'foo\']}}')).toBe('{{step_1[\'output\']?.[\'foo\']}}')
        })
        it('A10. special chars in bracket key', () => {
            expect(rewrite('{{step_1["it\'s"]}}')).toBe('{{step_1[\'output\']["it\'s"]}}')
        })
    })

    describe('B. Multiple step references in one expression', () => {
        it('B1. two distinct steps', () => {
            expect(rewrite('{{step_1.foo + step_2.bar}}')).toBe('{{step_1[\'output\'].foo + step_2[\'output\'].bar}}')
        })
        it('B2. same step twice', () => {
            expect(rewrite('{{step_1.foo + step_1.bar}}')).toBe('{{step_1[\'output\'].foo + step_1[\'output\'].bar}}')
        })
        it('B3. step inside computed bracket', () => {
            expect(rewrite('{{step_1[step_2.id]}}')).toBe('{{step_1[\'output\'][step_2[\'output\'].id]}}')
        })
        it('B4. as function args', () => {
            expect(rewrite('{{f(step_1, step_2)}}')).toBe('{{f(step_1[\'output\'], step_2[\'output\'])}}')
        })
        it('B5. in array literal', () => {
            expect(rewrite('{{[step_1, step_2]}}')).toBe('{{[step_1[\'output\'], step_2[\'output\']]}}')
        })
    })

    describe('C. Multiple mentions in one input string', () => {
        it('C1. two mentions, plain text', () => {
            expect(rewrite('Hello {{step_1.name}} from {{step_2.city}}'))
                .toBe('Hello {{step_1[\'output\'].name}} from {{step_2[\'output\'].city}}')
        })
        it('C2. mention + literal', () => {
            expect(rewrite('Result: {{step_1.foo}}!')).toBe('Result: {{step_1[\'output\'].foo}}!')
        })
        it('C3. adjacent mentions', () => {
            expect(rewrite('{{step_1.a}}{{step_2.b}}')).toBe('{{step_1[\'output\'].a}}{{step_2[\'output\'].b}}')
        })
        it('C4. same step in different mentions', () => {
            expect(rewrite('{{step_1.x}}-{{step_1.y}}')).toBe('{{step_1[\'output\'].x}}-{{step_1[\'output\'].y}}')
        })
    })

    describe('D. JS operators and constructs', () => {
        it('D1. strict equality', () => {
            expect(rewrite('{{step_1 === undefined}}')).toBe('{{step_1[\'output\'] === undefined}}')
        })
        it('D2. arithmetic', () => {
            expect(rewrite('{{step_1.count + 1}}')).toBe('{{step_1[\'output\'].count + 1}}')
        })
        it('D3. string concat', () => {
            expect(rewrite('{{step_1.first + \' \' + step_1.last}}'))
                .toBe('{{step_1[\'output\'].first + \' \' + step_1[\'output\'].last}}')
        })
        it('D4. template literal', () => {
            expect(rewrite('{{`Hello ${step_1.name}`}}')).toBe('{{`Hello ${step_1[\'output\'].name}`}}')
        })
        it('D5. ternary', () => {
            expect(rewrite('{{step_1 ? step_1.x : \'default\'}}'))
                .toBe('{{step_1[\'output\'] ? step_1[\'output\'].x : \'default\'}}')
        })
        it('D6. logical AND', () => {
            expect(rewrite('{{step_1 && step_1.x}}')).toBe('{{step_1[\'output\'] && step_1[\'output\'].x}}')
        })
        it('D7. logical OR fallback', () => {
            expect(rewrite('{{step_1 || \'fallback\'}}')).toBe('{{step_1[\'output\'] || \'fallback\'}}')
        })
        it('D8. nullish coalescing', () => {
            expect(rewrite('{{step_1 ?? \'fallback\'}}')).toBe('{{step_1[\'output\'] ?? \'fallback\'}}')
        })
        it('D9. negation', () => {
            expect(rewrite('{{!step_1.foo}}')).toBe('{{!step_1[\'output\'].foo}}')
        })
        it('D10. typeof', () => {
            expect(rewrite('{{typeof step_1}}')).toBe('{{typeof step_1[\'output\']}}')
        })
        it('D11. array spread', () => {
            expect(rewrite('{{[...step_1.items]}}')).toBe('{{[...step_1[\'output\'].items]}}')
        })
        it('D12. object spread', () => {
            expect(rewrite('{{({...step_1, foo: 1})}}')).toBe('{{({...step_1[\'output\'], foo: 1})}}')
        })
    })

    describe('E. Function calls', () => {
        it('E1. plain call with step arg', () => {
            expect(rewrite('{{toUpperCase(step_1.name)}}')).toBe('{{toUpperCase(step_1[\'output\'].name)}}')
        })
        it('E2. method on step', () => {
            expect(rewrite('{{step_1.items.map(x => x.id)}}')).toBe('{{step_1[\'output\'].items.map(x => x.id)}}')
        })
        it('E3. method chain (only head step ref rewritten)', () => {
            expect(rewrite('{{step_1.items.filter(x => x).map(x => x.id)}}'))
                .toBe('{{step_1[\'output\'].items.filter(x => x).map(x => x.id)}}')
        })
        it('E4. nested calls', () => {
            expect(rewrite('{{outer(inner(step_1))}}')).toBe('{{outer(inner(step_1[\'output\']))}}')
        })
        it('E5. flattenNestedKeys dot form', () => {
            expect(rewrite('{{flattenNestedKeys(step_1, [\'items\'])}}'))
                .toBe('{{flattenNestedKeys(step_1[\'output\'], [\'items\'])}}')
        })
        it('E6. flattenNestedKeys bracket form', () => {
            expect(rewrite('{{flattenNestedKeys(step_1[\'result\'], [\'items\'])}}'))
                .toBe('{{flattenNestedKeys(step_1[\'output\'][\'result\'], [\'items\'])}}')
        })
    })

    describe('F. Object literals — property-key vs. value semantics', () => {
        it('F1. property key matching step name (NOT rewritten)', () => {
            expect(rewrite('{{({ step_1: \'tag\' })}}')).toBe('{{({ step_1: \'tag\' })}}')
        })
        it('F2. shorthand property (deshorthanded)', () => {
            expect(rewrite('{{({ step_1 })}}')).toBe('{{({ step_1: step_1[\'output\'] })}}')
        })
        it('F3. computed key (rewritten)', () => {
            expect(rewrite('{{({ [step_1.foo]: \'value\' })}}'))
                .toBe('{{({ [step_1[\'output\'].foo]: \'value\' })}}')
        })
        it('F4. method shorthand (NOT rewritten)', () => {
            expect(rewrite('{{({ step_1() { return 1 } })}}'))
                .toBe('{{({ step_1() { return 1 } })}}')
        })
        it('F5. property value referencing step', () => {
            expect(rewrite('{{({ data: step_1 })}}')).toBe('{{({ data: step_1[\'output\'] })}}')
        })
    })

    describe('G. Local bindings — must NOT rewrite', () => {
        it('G1. function expression param', () => {
            expect(rewrite('{{(function(step_1) { return step_1.foo })(x)}}'))
                .toBe('{{(function(step_1) { return step_1.foo })(x)}}')
        })
        it('G2. arrow function param', () => {
            expect(rewrite('{{((step_1) => step_1.foo)(x)}}'))
                .toBe('{{((step_1) => step_1.foo)(x)}}')
        })
        it('G3. multi-param arrow', () => {
            expect(rewrite('{{((step_1, step_2) => step_1)(x, y)}}'))
                .toBe('{{((step_1, step_2) => step_1)(x, y)}}')
        })
        it('G4. default param', () => {
            expect(rewrite('{{((step_1 = 5) => step_1)()}}'))
                .toBe('{{((step_1 = 5) => step_1)()}}')
        })
        it('G5. destructured param', () => {
            expect(rewrite('{{(({step_1}) => step_1)(obj)}}'))
                .toBe('{{(({step_1}) => step_1)(obj)}}')
        })
        it('G6. var declaration in IIFE', () => {
            expect(rewrite('{{(function() { var step_1 = 5; return step_1 })()}}'))
                .toBe('{{(function() { var step_1 = 5; return step_1 })()}}')
        })
        it('G7. let declaration in arrow', () => {
            expect(rewrite('{{(() => { let step_1 = 5; return step_1 })()}}'))
                .toBe('{{(() => { let step_1 = 5; return step_1 })()}}')
        })
        it('G8. const declaration', () => {
            expect(rewrite('{{(() => { const step_1 = 5; return step_1 })()}}'))
                .toBe('{{(() => { const step_1 = 5; return step_1 })()}}')
        })
        it('G9. catch param', () => {
            expect(rewrite('{{(function() { try {} catch (step_1) { return step_1 } })()}}'))
                .toBe('{{(function() { try {} catch (step_1) { return step_1 } })()}}')
        })
        it('G10. inner function declaration', () => {
            expect(rewrite('{{(function() { function step_1() {}; return step_1 })()}}'))
                .toBe('{{(function() { function step_1() {}; return step_1 })()}}')
        })
        it('G11. class declaration', () => {
            expect(rewrite('{{(() => { class step_1 {}; return step_1 })()}}'))
                .toBe('{{(() => { class step_1 {}; return step_1 })()}}')
        })
    })

    describe('H. Mixed outer-ref + inner-shadow', () => {
        it('H1. outer ref + IIFE shadow', () => {
            expect(rewrite('{{step_1.foo + (function() { var step_1; return step_1 })()}}'))
                .toBe('{{step_1[\'output\'].foo + (function() { var step_1; return step_1 })()}}')
        })
        it('H2. outer ref + arrow shadow', () => {
            expect(rewrite('{{step_1.x + ((step_1) => step_1)(0)}}'))
                .toBe('{{step_1[\'output\'].x + ((step_1) => step_1)(0)}}')
        })
        it('H3. outer ref + lambda param shadows in callback', () => {
            expect(rewrite('{{step_1.items.map(step_1 => step_1.id)}}'))
                .toBe('{{step_1[\'output\'].items.map(step_1 => step_1.id)}}')
        })
    })

    describe('I. Step-name detection precision', () => {
        it('I1. canonical pattern always rewrites (step_10 not in flow)', () => {
            expect(rewrite('{{step_1.foo + step_10.bar}}', ['step_1']))
                .toBe('{{step_1[\'output\'].foo + step_10[\'output\'].bar}}')
        })
        it('I2. step_1 and step_10 both in flow', () => {
            expect(rewrite('{{step_1.foo + step_10.bar}}', ['step_1', 'step_10']))
                .toBe('{{step_1[\'output\'].foo + step_10[\'output\'].bar}}')
        })
        it('I3. custom step name in flow list', () => {
            expect(rewrite('{{my_action.result}}', ['my_action']))
                .toBe('{{my_action[\'output\'].result}}')
        })
        it('I4. custom step name NOT in flow list', () => {
            expect(rewrite('{{my_orphan.foo}}', ['step_1'])).toBe('{{my_orphan.foo}}')
        })
        it('I5. property named like step name', () => {
            expect(rewrite('{{obj.step_1}}')).toBe('{{obj.step_1}}')
        })
        it('I6. string literal matching step name', () => {
            expect(rewrite('{{\'step_1\'}}')).toBe('{{\'step_1\'}}')
        })
    })

    describe('J. Trigger handling', () => {
        it('J1. bare trigger', () => {
            expect(rewrite('{{trigger}}')).toBe('{{trigger[\'output\']}}')
        })
        it('J2. trigger dot', () => {
            expect(rewrite('{{trigger.body.x}}')).toBe('{{trigger[\'output\'].body.x}}')
        })
        it('J3. trigger bracket', () => {
            expect(rewrite('{{trigger[\'body\'].x}}')).toBe('{{trigger[\'output\'][\'body\'].x}}')
        })
    })

    describe('K. Loop iteration paths', () => {
        it('K1. outer loop access via dot', () => {
            expect(rewrite('{{step_3.iterations[0].step_8.output.foo}}'))
                .toBe('{{step_3[\'output\'].iterations[0].step_8.output.foo}}')
        })
        it('K2. outer loop access bracketed', () => {
            expect(rewrite('{{step_3[\'iterations\'][0][\'step_8\'].output.foo}}'))
                .toBe('{{step_3[\'output\'][\'iterations\'][0][\'step_8\'].output.foo}}')
        })
        it('K3. computed bracket with step ref inside', () => {
            expect(rewrite('{{step_3.iterations[step_1.idx].step_8.foo}}'))
                .toBe('{{step_3[\'output\'].iterations[step_1[\'output\'].idx].step_8.foo}}')
        })
        it('K4. inside-loop top-level ref to sibling', () => {
            expect(rewrite('{{step_8.foo}}')).toBe('{{step_8[\'output\'].foo}}')
        })
        it('K5. current iteration item via bracket', () => {
            expect(rewrite('{{step_3[\'item\']}}')).toBe('{{step_3[\'output\'][\'item\']}}')
        })
        it('K6. nested access on iteration item', () => {
            expect(rewrite('{{step_3[\'item\'][\'subpropertyOfItem\']}}'))
                .toBe('{{step_3[\'output\'][\'item\'][\'subpropertyOfItem\']}}')
        })
        it('K7. current iteration item via dot', () => {
            expect(rewrite('{{step_3.item.foo}}')).toBe('{{step_3[\'output\'].item.foo}}')
        })
    })

    describe('L. Uniform [\'output\'] insertion regardless of next access', () => {
        it('L1. user accesses their own output field bracket', () => {
            expect(rewrite('{{step_1[\'output\']}}')).toBe('{{step_1[\'output\'][\'output\']}}')
        })
        it('L2. user accesses their own output field dot', () => {
            expect(rewrite('{{step_1.output}}')).toBe('{{step_1[\'output\'].output}}')
        })
        it('L3. user accesses their own output field then deeper', () => {
            expect(rewrite('{{step_1.output.foo}}')).toBe('{{step_1[\'output\'].output.foo}}')
        })
        it('L4. user accesses their own error field bracket', () => {
            expect(rewrite('{{step_1[\'error\']}}')).toBe('{{step_1[\'output\'][\'error\']}}')
        })
        it('L5. user accesses their own error.message via dot', () => {
            expect(rewrite('{{step_1.error.message}}')).toBe('{{step_1[\'output\'].error.message}}')
        })
    })

    describe('M. Defensive fallback for unparseable input', () => {
        it('M1. truncated expression', () => {
            expect(rewrite('{{step_1.}}')).toBe('{{step_1.}}')
        })
        it('M2. empty mention', () => {
            expect(rewrite('{{}}')).toBe('{{}}')
        })
        it('M3. whitespace-only mention', () => {
            expect(rewrite('{{ }}')).toBe('{{ }}')
        })
        it('M4. single brace not a mention', () => {
            expect(rewrite('{step_1.foo}')).toBe('{step_1.foo}')
        })
        it('M5. step name that is a JS reserved word', () => {
            expect(rewrite('{{class.foo}}', ['class'])).toBe('{{class.foo}}')
        })
    })

    describe('N. Tokens/expressions to leave alone', () => {
        it('N1. connections namespace', () => {
            expect(rewrite('{{connections[\'my-conn\']}}')).toBe('{{connections[\'my-conn\']}}')
        })
        it('N2. plain math, no step refs', () => {
            expect(rewrite('{{1 + 1}}')).toBe('{{1 + 1}}')
        })
        it('N3. plain string, no mentions', () => {
            expect(rewrite('hello world')).toBe('hello world')
        })
        it('N4. empty string', () => {
            expect(rewrite('')).toBe('')
        })
    })
})
