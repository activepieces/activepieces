import { McpProperty, McpPropertyType, mcpToolNameUtils } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { mcpToolInput } from '../../../../src/app/mcp/mcp-tool-input'

const ANTHROPIC_PROPERTY_KEY_PATTERN = /^[a-zA-Z0-9_.-]{1,64}$/

const text = (name: string, required = false): McpProperty => ({ name, type: McpPropertyType.TEXT, required })

const EMAIL_LOOKUP_FLOW: McpProperty[] = [
    text('Email Sender'),
    text('Email Subject'),
    text('Email Content'),
    text('After Date'),
    text('Before Date'),
]

const modelKeys = (properties: McpProperty[]) => Object.keys(mcpToolInput.modelInputShape({ properties }))

const keyFor = ({ properties, name }: { properties: McpProperty[], name: string }) => {
    const key = mcpToolInput.modelKeyByPropertyName({ properties }).get(name)
    expect(key, `no key was generated for ${name}`).toBeDefined()
    return key ?? name
}

describe('modelInputShape', () => {
    it('produces keys every provider accepts for the flow that was failing in production', () => {
        for (const key of modelKeys(EMAIL_LOOKUP_FLOW)) {
            expect(key, key).toMatch(ANTHROPIC_PROPERTY_KEY_PATTERN)
            expect(mcpToolNameUtils.isProviderSafeIdentifier(key), key).toBe(true)
        }
    })

    it('leaves an already-safe field name exactly as it was, so existing tools do not churn', () => {
        expect(modelKeys([text('email'), text('subject_line'), text('after-date'), text('_internal')]))
            .toEqual(['email', 'subject_line', 'after-date', '_internal'])
    })

    it('keeps the human label on any key it had to rewrite, so the model still knows what the field is', () => {
        const schema = z.toJSONSchema(z.object(mcpToolInput.modelInputShape({ properties: [text('Email Sender'), text('email')] })))
        expect(schema.properties?.['email_sender']).toMatchObject({ title: 'Email Sender' })
        expect(schema.properties?.['email']).not.toHaveProperty('title')
    })

    it('never collides two field names onto one key, which would drop a field silently', () => {
        const colliding = [text('Email Sender'), text('email sender'), text('EMAIL_SENDER'), text('email-sender')]
        const keys = modelKeys(colliding)
        expect(keys).toHaveLength(colliding.length)
        expect(new Set(keys).size).toBe(colliding.length)
        for (const key of keys) {
            expect(key, key).toMatch(ANTHROPIC_PROPERTY_KEY_PATTERN)
        }
    })

    it('still yields a usable key when a name sanitises away to nothing', () => {
        const keys = modelKeys([text('日本語'), text('!!!'), text('   ')])
        expect(keys).toEqual(['field_1', 'field_2', 'field_3'])
        for (const key of keys) {
            expect(mcpToolNameUtils.isProviderSafeIdentifier(key), key).toBe(true)
        }
    })

    it('caps a very long name at the length providers allow', () => {
        const [key] = modelKeys([text('A very long human readable field label '.repeat(5))])
        expect(key.length).toBeLessThanOrEqual(64)
        expect(mcpToolNameUtils.isProviderSafeIdentifier(key)).toBe(true)
    })

    it('keeps a name that starts with a digit usable, since providers require a leading letter or underscore', () => {
        const [key] = modelKeys([text('1st Name')])
        expect(mcpToolNameUtils.isProviderSafeIdentifier(key)).toBe(true)
        expect(key).toMatch(ANTHROPIC_PROPERTY_KEY_PATTERN)
    })
})

describe('toFlowPayload', () => {
    it('hands the flow back its own field names, so trigger references keep working', () => {
        const payload = mcpToolInput.toFlowPayload({
            properties: EMAIL_LOOKUP_FLOW,
            modelArgs: { email_sender: 'a@b.com', email_subject: 'Invoice', after_date: '2026-09-01' },
        })
        expect(payload).toEqual({ 'Email Sender': 'a@b.com', 'Email Subject': 'Invoice', 'After Date': '2026-09-01' })
    })

    it('still accepts the original field name, so a client holding the old schema keeps working', () => {
        expect(mcpToolInput.toFlowPayload({ properties: EMAIL_LOOKUP_FLOW, modelArgs: { 'Email Sender': 'a@b.com' } }))
            .toEqual({ 'Email Sender': 'a@b.com' })
    })

    it('never lets the model reach a flow input the tool schema did not declare', () => {
        expect(mcpToolInput.toFlowPayload({ properties: EMAIL_LOOKUP_FLOW, modelArgs: { hidden_flow_input: 'x' } }))
            .toEqual({})
    })

    it('keeps the declared fields and drops the undeclared ones in the same call', () => {
        expect(mcpToolInput.toFlowPayload({ properties: EMAIL_LOOKUP_FLOW, modelArgs: { email_sender: 'a@b.com', hidden_flow_input: 'x' } }))
            .toEqual({ 'Email Sender': 'a@b.com' })
    })

    it('omits a field the model did not supply instead of sending undefined', () => {
        expect(mcpToolInput.toFlowPayload({ properties: EMAIL_LOOKUP_FLOW, modelArgs: {} })).toEqual({})
    })

    it('round-trips every field of the failing production schema', () => {
        const keys = mcpToolInput.modelKeyByPropertyName({ properties: EMAIL_LOOKUP_FLOW })
        const modelArgs = Object.fromEntries([...keys.values()].map((key, index) => [key, `value-${index}`]))
        const payload = mcpToolInput.toFlowPayload({ properties: EMAIL_LOOKUP_FLOW, modelArgs })
        expect(Object.keys(payload)).toEqual(EMAIL_LOOKUP_FLOW.map((property) => property.name))
    })

    it('preserves a falsy value rather than treating it as absent', () => {
        const properties = [text('Send Copy'), text('Retry Count')]
        expect(mcpToolInput.toFlowPayload({ properties, modelArgs: { send_copy: false, retry_count: 0 } }))
            .toEqual({ 'Send Copy': false, 'Retry Count': 0 })
    })
})

describe('a rewritten key that looks like another field name', () => {
    const OVERLAPPING: McpProperty[] = [text('Email Sender'), text('email_sender')]

    it('never hands one field a key that is another field\'s name', () => {
        const keys = mcpToolInput.modelKeyByPropertyName({ properties: OVERLAPPING })
        const names = new Set(OVERLAPPING.map((property) => property.name))
        for (const [name, key] of keys) {
            expect(names.has(key) && key !== name, `${name} -> ${key}`).toBe(false)
        }
    })

    it('keeps both values distinct when a cached client sends the original labels', () => {
        expect(mcpToolInput.toFlowPayload({ properties: OVERLAPPING, modelArgs: { 'Email Sender': 'AAA', email_sender: 'BBB' } }))
            .toEqual({ 'Email Sender': 'AAA', email_sender: 'BBB' })
    })

    it('keeps both values distinct when the model sends the rewritten keys', () => {
        const modelArgs = {
            [keyFor({ properties: OVERLAPPING, name: 'Email Sender' })]: 'AAA',
            [keyFor({ properties: OVERLAPPING, name: 'email_sender' })]: 'BBB',
        }
        expect(mcpToolInput.toFlowPayload({ properties: OVERLAPPING, modelArgs }))
            .toEqual({ 'Email Sender': 'AAA', email_sender: 'BBB' })
    })

    it('holds when a field is named the same as the positional fallback', () => {
        const properties = [text('日本語'), text('field_1')]
        expect(keyFor({ properties, name: '日本語' })).not.toBe('field_1')
        expect(keyFor({ properties, name: 'field_1' })).toBe('field_1')
        expect(mcpToolInput.toFlowPayload({ properties, modelArgs: { [keyFor({ properties, name: '日本語' })]: 'A', field_1: 'B' } }))
            .toEqual({ '日本語': 'A', field_1: 'B' })
    })
})
