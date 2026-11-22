import { describe, expect, it } from 'vitest'
import { extractMustacheTokens } from '../src/lib/mustache-utils'

describe('extractMustacheTokens', () => {
    it('extracts simple tokens', () => {
        const tokens = extractMustacheTokens('Hello {{name}}!')
        expect(tokens).toEqual([
            {
                token: '{{name}}',
                inner: 'name',
                index: 6,
            },
        ])
    })

    it('extracts nested object literals without premature truncation', () => {
        const input = '{{JSON.stringify({a: {x: 1}})}}'
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([
            {
                token: '{{JSON.stringify({a: {x: 1}})}}',
                inner: 'JSON.stringify({a: {x: 1}})',
                index: 0,
            },
        ])
    })

    it('handles string literals containing closing braces', () => {
        const input = '{{ "ends with }}" }}'
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([
            {
                token: '{{ "ends with }}" }}',
                inner: ' "ends with }}" ',
                index: 0,
            },
        ])
    })

    it('handles nested balanced double curlies in strings', () => {
        const input = "{{step_1.tpl.replace('{{x}}', step_2.y)}}"
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([
            {
                token: "{{step_1.tpl.replace('{{x}}', step_2.y)}}",
                inner: "step_1.tpl.replace('{{x}}', step_2.y)",
                index: 0,
            },
        ])
    })

    it('extracts multiple tokens with text surrounding them', () => {
        const input = 'Hello {{user.name}}, your code is {{JSON.stringify({code: 123})}}!'
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([
            {
                token: '{{user.name}}',
                inner: 'user.name',
                index: 6,
            },
            {
                token: '{{JSON.stringify({code: 123})}}',
                inner: 'JSON.stringify({code: 123})',
                index: 34,
            },
        ])
    })

    it('handles escaped quotes inside string literals', () => {
        const input = '{{ "escaped \\" and }}" }}'
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([
            {
                token: '{{ "escaped \\" and }}" }}',
                inner: ' "escaped \\" and }}" ',
                index: 0,
            },
        ])
    })

    it('handles template literals', () => {
        const input = '{{ `item: ${JSON.stringify({id: 1})}` }}'
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([
            {
                token: '{{ `item: ${JSON.stringify({id: 1})}` }}',
                inner: ' `item: ${JSON.stringify({id: 1})}` ',
                index: 0,
            },
        ])
    })

    it('handles back-to-back tokens', () => {
        const input = '{{a}}{{b}}'
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([
            { token: '{{a}}', inner: 'a', index: 0 },
            { token: '{{b}}', inner: 'b', index: 5 },
        ])
    })

    it('handles unclosed tokens gracefully', () => {
        const input = '{{unclosed'
        const tokens = extractMustacheTokens(input)
        expect(tokens).toEqual([])
    })
})
