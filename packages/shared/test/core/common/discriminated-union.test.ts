import Ajv from 'ajv'
import { TSchema, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../../../src'

function createAjvLikeServer(): Ajv {
    return new Ajv({
        removeAdditional: 'all',
        useDefaults: true,
        discriminator: true,
        coerceTypes: 'array',
        strict: false,
    })
}

const RouterSchema = Type.Object({
    type: Type.Literal('ROUTER'),
    name: Type.String(),
    settings: Type.Object({ executionType: Type.String() }),
    branches: Type.Optional(Type.Array(Type.Object({
        branchName: Type.String(),
        steps: Type.Array(Type.String()),
    }))),
})

const LoopSchema = Type.Object({
    type: Type.Literal('LOOP'),
    name: Type.String(),
    settings: Type.Object({ items: Type.String() }),
    children: Type.Optional(Type.Array(Type.String())),
})

const CodeSchema = Type.Object({
    type: Type.Literal('CODE'),
    name: Type.String(),
    settings: Type.Object({ sourceCode: Type.String() }),
})

describe('AJV removeAdditional with Type.Union vs DiscriminatedUnion', () => {

    describe('Type.Union (anyOf) strips variant-specific fields', () => {

        const ActionSchema = Type.Union([CodeSchema, RouterSchema, LoopSchema])

        it('should strip branches from a router action', () => {
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(ActionSchema)

            const data = {
                type: 'ROUTER',
                name: 'step_1',
                settings: { executionType: 'EXECUTE_FIRST_MATCH' },
                branches: [{ branchName: 'Branch 1', steps: ['step_2'] }],
            }
            validate(data)

            expect(data).not.toHaveProperty('branches')
        })

        it('should strip children from a loop action', () => {
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(ActionSchema)

            const data = {
                type: 'LOOP',
                name: 'step_1',
                settings: { items: '{{trigger.items}}' },
                children: ['step_2', 'step_3'],
            }
            validate(data)

            expect(data).not.toHaveProperty('children')
        })
    })

    describe('DiscriminatedUnion (oneOf + discriminator) preserves variant-specific fields', () => {

        const ActionSchema = DiscriminatedUnion('type', [CodeSchema, RouterSchema, LoopSchema])

        it('should preserve branches on a router action', () => {
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(ActionSchema)

            const data = {
                type: 'ROUTER',
                name: 'step_1',
                settings: { executionType: 'EXECUTE_FIRST_MATCH' },
                branches: [{ branchName: 'Branch 1', steps: ['step_2'] }],
            }
            const valid = validate(data)

            expect(valid).toBe(true)
            expect(data.branches).toEqual([
                { branchName: 'Branch 1', steps: ['step_2'] },
            ])
        })

        it('should preserve children on a loop action', () => {
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(ActionSchema)

            const data = {
                type: 'LOOP',
                name: 'step_1',
                settings: { items: '{{trigger.items}}' },
                children: ['step_2', 'step_3'],
            }
            const valid = validate(data)

            expect(valid).toBe(true)
            expect(data.children).toEqual(['step_2', 'step_3'])
        })

        it('should still strip truly unknown fields', () => {
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(ActionSchema)

            const data = {
                type: 'ROUTER',
                name: 'step_1',
                settings: { executionType: 'EXECUTE_FIRST_MATCH' },
                branches: [{ branchName: 'Branch 1', steps: ['step_2'] }],
                bogus: 'should-be-removed',
            }
            validate(data)

            expect(data).not.toHaveProperty('bogus')
            expect(data.branches).toBeDefined()
        })

        it('should not add variant fields to a code action', () => {
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(ActionSchema)

            const data = {
                type: 'CODE',
                name: 'step_1',
                settings: { sourceCode: 'console.log(1)' },
            }
            const valid = validate(data)

            expect(valid).toBe(true)
            expect(data).not.toHaveProperty('branches')
            expect(data).not.toHaveProperty('children')
        })
    })

    describe('nested unions (FlowOperationRequest pattern)', () => {

        const UpdateActionPlain = Type.Union([CodeSchema, RouterSchema, LoopSchema])
        const UpdateActionDiscriminated = DiscriminatedUnion('type', [CodeSchema, RouterSchema, LoopSchema])

        const DeleteActionSchema = Type.Object({
            names: Type.Array(Type.String()),
        })

        function buildFlowOpRequest(updateAction: TSchema) {
            return Type.Union([
                Type.Object({
                    type: Type.Literal('UPDATE_ACTION'),
                    request: updateAction,
                }),
                Type.Object({
                    type: Type.Literal('DELETE_ACTION'),
                    request: DeleteActionSchema,
                }),
            ])
        }

        it('should strip branches when inner union is plain Type.Union', () => {
            const schema = buildFlowOpRequest(UpdateActionPlain)
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(schema)

            const data = {
                type: 'UPDATE_ACTION',
                request: {
                    type: 'ROUTER',
                    name: 'step_1',
                    settings: { executionType: 'EXECUTE_FIRST_MATCH' },
                    branches: [{ branchName: 'Branch 1', steps: ['step_2'] }],
                },
            }
            validate(data)

            expect(data.request).not.toHaveProperty('branches')
        })

        it('should preserve branches when inner union is DiscriminatedUnion', () => {
            const schema = buildFlowOpRequest(UpdateActionDiscriminated)
            const ajv = createAjvLikeServer()
            const validate = ajv.compile(schema)

            const data = {
                type: 'UPDATE_ACTION',
                request: {
                    type: 'ROUTER',
                    name: 'step_1',
                    settings: { executionType: 'EXECUTE_FIRST_MATCH' },
                    branches: [{ branchName: 'Branch 1', steps: ['step_2'] }],
                },
            }
            const valid = validate(data)

            expect(valid).toBe(true)
            expect(data.request.branches).toEqual([
                { branchName: 'Branch 1', steps: ['step_2'] },
            ])
        })
    })

    describe('branch schema preserves conditions on CONDITION branches', () => {

        const ConditionSchema = Type.Object({
            firstValue: Type.String(),
            secondValue: Type.Optional(Type.String()),
            caseSensitive: Type.Optional(Type.Boolean()),
            operator: Type.Optional(Type.String()),
        })

        const BranchSchema = DiscriminatedUnion('branchType', [
            Type.Object({
                branchType: Type.Literal('CONDITION'),
                branchName: Type.String(),
                steps: Type.Array(Type.String()),
                conditions: Type.Array(Type.Array(ConditionSchema)),
            }),
            Type.Object({
                branchType: Type.Literal('FALLBACK'),
                branchName: Type.String(),
                steps: Type.Array(Type.String()),
            }),
        ])

        it('should preserve conditions on a CONDITION branch', () => {
            const ajv = createAjvLikeServer()
            const schema = Type.Array(BranchSchema)
            const validate = ajv.compile(schema)

            const data = [
                {
                    branchType: 'CONDITION',
                    branchName: 'Branch 1',
                    steps: ['step_2'],
                    conditions: [[{
                        firstValue: '{{trigger.name}}',
                        secondValue: 'test',
                        operator: 'TEXT_CONTAINS',
                        caseSensitive: false,
                    }]],
                },
                {
                    branchType: 'FALLBACK',
                    branchName: 'Otherwise',
                    steps: ['step_3'],
                },
            ]
            const valid = validate(data)

            expect(valid).toBe(true)
            expect(data[0].conditions).toBeDefined()
            expect(data[0].conditions[0][0].operator).toBe('TEXT_CONTAINS')
            expect(data[0].conditions[0][0].caseSensitive).toBe(false)
            expect(data[0].conditions[0][0].secondValue).toBe('test')
        })

        it('should strip conditions from FALLBACK branches', () => {
            const ajv = createAjvLikeServer()
            const schema = Type.Array(BranchSchema)
            const validate = ajv.compile(schema)

            const data = [
                {
                    branchType: 'FALLBACK',
                    branchName: 'Otherwise',
                    steps: [],
                    conditions: [[{ firstValue: 'x', secondValue: 'y' }]],
                },
            ]
            validate(data)

            expect(data[0]).not.toHaveProperty('conditions')
        })
    })

    describe('condition union vs single object', () => {

        it('Type.Union of condition variants strips fields when simpler variant is tried first', () => {
            const ajv = createAjvLikeServer()
            const SingleValueCondition = Type.Object({
                firstValue: Type.String(),
                operator: Type.Optional(Type.Literal('EXISTS')),
            })
            const TextCondition = Type.Object({
                firstValue: Type.String(),
                secondValue: Type.String(),
                caseSensitive: Type.Optional(Type.Boolean()),
                operator: Type.Optional(Type.Literal('TEXT_CONTAINS')),
            })
            const ConditionUnion = Type.Union([SingleValueCondition, TextCondition])
            const validate = ajv.compile(ConditionUnion)

            const data = {
                firstValue: 'hello',
                secondValue: 'world',
                caseSensitive: true,
                operator: 'TEXT_CONTAINS',
            }
            validate(data)

            expect(data).not.toHaveProperty('caseSensitive')
            expect(data).not.toHaveProperty('secondValue')
        })

        it('single merged object schema preserves all condition fields', () => {
            const ajv = createAjvLikeServer()
            const MergedCondition = Type.Object({
                firstValue: Type.String(),
                secondValue: Type.Optional(Type.String()),
                caseSensitive: Type.Optional(Type.Boolean()),
                operator: Type.Optional(Type.Union([
                    Type.Literal('TEXT_CONTAINS'),
                    Type.Literal('EXISTS'),
                ])),
            })
            const validate = ajv.compile(MergedCondition)

            const data = {
                firstValue: 'hello',
                secondValue: 'world',
                caseSensitive: true,
                operator: 'TEXT_CONTAINS',
            }
            const valid = validate(data)

            expect(valid).toBe(true)
            expect(data.secondValue).toBe('world')
            expect(data.caseSensitive).toBe(true)
            expect(data.operator).toBe('TEXT_CONTAINS')
        })
    })
})
