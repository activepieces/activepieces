import { FieldControlMode } from '@activepieces/core-piece-types'
import { ActivepiecesError } from '@activepieces/core-utils'
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { describe, expect, it, vi } from 'vitest'
import { CompleteObject, FillInputPorts, pieceInputFiller, ResolveProperty } from '../../../../../src/app/ee/agent/tools/piece-input-filler'
import { PropertyResolutionResult } from '../../../../../src/app/mcp/tools/mcp-utils'

function prop(overrides: Record<string, unknown>): Record<string, unknown> {
    return { displayName: 'x', required: false, ...overrides }
}

const props = (map: Record<string, unknown>): PiecePropertyMap => map as never

const noOptions: ResolveProperty = () => Promise.resolve({ status: 'failed', message: 'no options here' })

function completerReturning(answers: Record<string, unknown>[]) {
    const prompts: string[] = []
    const completeObject: CompleteObject = ({ prompt }) => {
        prompts.push(prompt)
        return Promise.resolve(answers[Math.min(prompts.length - 1, answers.length - 1)] ?? {})
    }
    return { completeObject, prompts }
}

function portsWith(answers: Record<string, unknown>[], resolveProperty: ResolveProperty = noOptions): FillInputPorts & { prompts: string[] } {
    const { completeObject, prompts } = completerReturning(answers)
    return { completeObject, resolveProperty, prompts }
}

const sendMessage = (properties: PiecePropertyMap) => ({ name: 'send_message', properties })

describe('pieceInputFiller.fillInput', () => {
    it('asks once per dependency wave, not once per input', async () => {
        const ports = portsWith([{ workspace: 'W1' }, { channel: 'C1' }])

        await pieceInputFiller.fillInput({
            action: sendMessage(props({
                workspace: prop({ type: PropertyType.SHORT_TEXT, required: true }),
                channel: prop({ type: PropertyType.SHORT_TEXT, required: true, refreshers: ['workspace'] }),
            })),
            instruction: 'post in the general channel',
            ports,
        })

        expect(ports.prompts).toHaveLength(2)
    })

    it('feeds each wave the values the previous wave produced', async () => {
        const ports = portsWith([{ workspace: 'W1' }, { channel: 'C1' }])

        await pieceInputFiller.fillInput({
            action: sendMessage(props({
                workspace: prop({ type: PropertyType.SHORT_TEXT, required: true }),
                channel: prop({ type: PropertyType.SHORT_TEXT, required: true, refreshers: ['workspace'] }),
            })),
            instruction: 'post something',
            ports,
        })

        expect(ports.prompts[0]).not.toContain('W1')
        expect(ports.prompts[1]).toContain('W1')
    })

    it('returns the pinned values alongside what the model filled', async () => {
        const ports = portsWith([{ text: 'hello' }])

        const input = await pieceInputFiller.fillInput({
            action: sendMessage(props({
                channel: prop({ type: PropertyType.SHORT_TEXT }),
                text: prop({ type: PropertyType.SHORT_TEXT, required: true }),
            })),
            predefinedInput: {
                auth: 'conn-1',
                fields: { channel: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'C123' } },
            } as never,
            instruction: 'say hello',
            ports,
        })

        expect(input).toEqual({ auth: 'conn-1', channel: 'C123', text: 'hello' })
    })

    it('never asks for an input the operator pinned', async () => {
        const ports = portsWith([{ text: 'hello' }])

        await pieceInputFiller.fillInput({
            action: sendMessage(props({
                channel: prop({ type: PropertyType.SHORT_TEXT }),
                text: prop({ type: PropertyType.SHORT_TEXT, required: true }),
            })),
            predefinedInput: { fields: { channel: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'C123' } } } as never,
            instruction: 'say hello',
            ports,
        })

        expect(ports.prompts[0]).toContain('Fill in the inputs "text"')
    })

    it('keeps the connection out of the prompt', async () => {
        const ports = portsWith([{ text: 'hi' }])

        await pieceInputFiller.fillInput({
            action: { ...sendMessage(props({ text: prop({ type: PropertyType.SHORT_TEXT, required: true }) })), connectionExternalId: 'conn-secret' },
            predefinedInput: { auth: 'conn-secret' } as never,
            instruction: 'say hi',
            ports,
        })

        expect(ports.prompts[0]).not.toContain('conn-secret')
    })

    it('shows the real dropdown options so the model cannot invent one', async () => {
        const withOptions: ResolveProperty = () => Promise.resolve<PropertyResolutionResult>({
            status: 'options',
            options: [{ label: 'general', value: 'C1' }],
        })
        const ports = portsWith([{ channel: 'C1' }], withOptions)

        await pieceInputFiller.fillInput({
            action: sendMessage(props({ channel: prop({ type: PropertyType.DROPDOWN, required: true }) })),
            instruction: 'post in general',
            ports,
        })

        expect(ports.prompts[0]).toContain('general')
        expect(ports.prompts[0]).toContain('C1')
    })

    it('still asks the model when the options lookup fails, rather than failing the action', async () => {
        const failing: ResolveProperty = () => Promise.reject(new Error('connection expired'))
        const ports = portsWith([{ channel: 'C1' }], failing)

        const input = await pieceInputFiller.fillInput({
            action: sendMessage(props({ channel: prop({ type: PropertyType.DROPDOWN, required: true }) })),
            instruction: 'post in general',
            ports,
        })

        expect(input).toEqual({ channel: 'C1' })
    })

    it('does not call the model at all when every input is pinned', async () => {
        const ports = portsWith([{}])

        const input = await pieceInputFiller.fillInput({
            action: sendMessage(props({ channel: prop({ type: PropertyType.SHORT_TEXT }) })),
            predefinedInput: { fields: { channel: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'C123' } } } as never,
            instruction: 'post',
            ports,
        })

        expect(ports.prompts).toHaveLength(0)
        expect(input).toEqual({ channel: 'C123' })
    })

    it('turns a dynamic field into a loose schema built from what the piece reports', async () => {
        const reportsFields: ResolveProperty = () => Promise.resolve<PropertyResolutionResult>({
            status: 'dynamic',
            props: props({ title: prop({ type: PropertyType.SHORT_TEXT, required: true }) }),
        })
        const captured: Record<string, unknown>[] = []
        const ports: FillInputPorts & { prompts: string[] } = {
            prompts: [],
            resolveProperty: reportsFields,
            completeObject: ({ schema }) => {
                captured.push(schema.safeParse({ fields: { title: 'a', unlisted: 'kept' } }))
                return Promise.resolve({ fields: { title: 'a' } })
            },
        }

        await pieceInputFiller.fillInput({
            action: sendMessage(props({ fields: prop({ type: PropertyType.DYNAMIC, required: true }) })),
            instruction: 'fill it',
            ports,
        })

        expect(captured[0]).toMatchObject({ success: true, data: { fields: { title: 'a', unlisted: 'kept' } } })
    })

    it('forwards the values decided so far when asking the piece for sub-fields, and keeps auth separate', async () => {
        const resolveProperty = vi.fn(() => Promise.resolve<PropertyResolutionResult>({ status: 'dynamic', props: props({}) }))
        const ports = portsWith([{ table: 'T1' }, { fields: {} }], resolveProperty)

        await pieceInputFiller.fillInput({
            action: { ...sendMessage(props({
                table: prop({ type: PropertyType.SHORT_TEXT, required: true }),
                fields: prop({ type: PropertyType.DYNAMIC, required: true, refreshers: ['table'] }),
            })), connectionExternalId: 'conn-9' },
            instruction: 'add a row',
            ports,
        })

        expect(resolveProperty).toHaveBeenCalledWith(expect.objectContaining({
            propertyName: 'fields',
            input: { table: 'T1' },
            auth: 'conn-9',
        }))
    })

    it('fails the action when the piece cannot describe a dynamic field', async () => {
        const cannotResolve: ResolveProperty = () => Promise.resolve({ status: 'failed', message: 'connection expired' })
        const ports = portsWith([{}], cannotResolve)

        await expect(pieceInputFiller.fillInput({
            action: sendMessage(props({ fields: prop({ type: PropertyType.DYNAMIC, required: true }) })),
            instruction: 'fill it',
            ports,
        })).rejects.toThrow(ActivepiecesError)
    })

    it('stops a piece that nests dynamic fields without end', async () => {
        const selfNesting: ResolveProperty = vi.fn(() => Promise.resolve<PropertyResolutionResult>({
            status: 'dynamic',
            props: props({ fields: prop({ type: PropertyType.DYNAMIC, required: true }) }),
        }))
        const ports = portsWith([{}], selfNesting)

        await expect(pieceInputFiller.fillInput({
            action: sendMessage(props({ fields: prop({ type: PropertyType.DYNAMIC, required: true }) })),
            instruction: 'fill it',
            ports,
        })).rejects.toThrow()

        expect(vi.mocked(selfNesting).mock.calls.length).toBeLessThanOrEqual(4)
    })
})
