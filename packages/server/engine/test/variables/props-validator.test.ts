import { PieceAuth, Property } from '@activepieces/pieces-framework'
import { propsProcessor } from '../../src/lib/variables/props-processor'
describe('Property Validation', () => {
    describe('required properties', () => {
        it('should validate required string property', async () => {
            const props = {
                text: Property.ShortText({
                    displayName: 'Text',
                    required: true,
                }),
            }

            const { errors: validErrors } = await propsProcessor.applyProcessorsAndValidators(
                { text: 'valid text' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validErrors).toEqual({})

            const { errors: nullErrors } = await propsProcessor.applyProcessorsAndValidators(
                { text: null },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(nullErrors).toEqual({
                text: ['Expected string, received: null'],
            })

            const { errors: undefinedErrors } = await propsProcessor.applyProcessorsAndValidators(
                { text: undefined },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(undefinedErrors).toEqual({
                text: ['Expected string, received: undefined'],
            })
        })

        it('should validate required number property', async () => {
            const props = {
                number: Property.Number({
                    displayName: 'Number',
                    required: true,
                }),
            }

            const { errors: validErrors } = await propsProcessor.applyProcessorsAndValidators(
                { number: 42 },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validErrors).toEqual({})

            const { errors: nullErrors } = await propsProcessor.applyProcessorsAndValidators(
                { number: null },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(nullErrors).toEqual({
                number: ['Expected number, received: null'],
            })

            const { errors: typeErrors } = await propsProcessor.applyProcessorsAndValidators(
                { number: 'not a number' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(typeErrors).toEqual({
                number: ['Expected number, received: not a number'],
            })
        })

        it('should validate required datetime property', async () => {
            const props = {
                date: Property.DateTime({
                    displayName: 'DateTime',
                    required: true,
                }),
            }

            const { errors: validErrors } = await propsProcessor.applyProcessorsAndValidators(
                { date: '2024-03-14T12:00:00.000Z' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validErrors).toEqual({})

            const { errors: invalidErrors } = await propsProcessor.applyProcessorsAndValidators(
                { date: 'not a date' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(invalidErrors).toEqual({
                date: ['Invalid datetime format. Expected ISO format (e.g. 2024-03-14T12:00:00.000Z), received: not a date'],
            })
        })

        it('should validate required array property', async () => {
            const props = {
                array: Property.Array({
                    displayName: 'Array',
                    required: true,
                }),
            }

            const { errors: validErrors } = await propsProcessor.applyProcessorsAndValidators(
                { array: [1, 2, 3] },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validErrors).toEqual({})

            const { errors: typeErrors } = await propsProcessor.applyProcessorsAndValidators(
                { array: 'not an array' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(typeErrors).toEqual({
                array: ['Expected array, received: not an array'],
            })
        })

        it('should validate required json property', async () => {
            const props = {
                json: Property.Json({
                    displayName: 'JSON',
                    required: true,
                }),
            }

            const { errors: validErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: { key: 'value' } },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validErrors).toEqual({})

            const { errors: validJsonStringErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: '{"key": "value"}' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validJsonStringErrors).toEqual({})

            const { errors: validArrayErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: [1, 2, 3] },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validArrayErrors).toEqual({})

            const { errors: validArrayStringErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: '[1, 2, 3]' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validArrayStringErrors).toEqual({})

            const { errors: invalidJsonErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: 'not a json object' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(invalidJsonErrors).toEqual({
                json: ['Expected JSON, received: not a json object'],
            })

            const { errors: nullErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: null },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(nullErrors).toEqual({
                json: ['Expected JSON, received: null'],
            })

            const { errors: emptyStringErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: '' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(emptyStringErrors).toEqual({
                json: ['Expected JSON, received: '],
            })

            const { errors: invalidTextErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: 'asd' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(invalidTextErrors).toEqual({
                json: ['Expected JSON, received: asd'],
            })
        })

        it('should validate optional json property with invalid value', async () => {
            const props = {
                json: Property.Json({
                    displayName: 'JSON',
                    required: false,
                }),
            }

            const { errors: validNullErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: null },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validNullErrors).toEqual({})

            const { errors: validUndefinedErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: undefined },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validUndefinedErrors).toEqual({})

            const { errors: emptyStringErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: '' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(emptyStringErrors).toEqual({})

            const { errors: invalidJsonErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: 'not a json object' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(invalidJsonErrors).toEqual({
                json: ['Expected JSON, received: not a json object'],
            })

            const { errors: invalidTextErrors } = await propsProcessor.applyProcessorsAndValidators(
                { json: 'asd' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(invalidTextErrors).toEqual({
                json: ['Expected JSON, received: asd'],
            })
        })
        it('should validate required object property', async () => {
            const props = {
                object: Property.Object({
                    displayName: 'Object',
                    required: true,
                }),
            }

            const { errors: validErrors } = await propsProcessor.applyProcessorsAndValidators(
                { object: { key: 'value' } },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(validErrors).toEqual({})

            const { errors: nullErrors } = await propsProcessor.applyProcessorsAndValidators(
                { object: null },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(nullErrors).toEqual({
                object: ['Expected object, received: null'],
            })

            const { errors: typeErrors } = await propsProcessor.applyProcessorsAndValidators(
                { object: 'not an object' },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(typeErrors).toEqual({
                object: ['Expected object, received: not an object'],
            })

            const { errors: jsonStringErrors } = await propsProcessor.applyProcessorsAndValidators(
                { object: JSON.stringify({ key: 'value' }) },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(jsonStringErrors).toEqual({})

            const { errors: undefinedErrors } = await propsProcessor.applyProcessorsAndValidators(
                { object: { key: 'value' } },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(undefinedErrors).toEqual({})
        })
    })

    describe('optional properties', () => {
        it('should validate optional properties', async () => {
            const props = {
                text: Property.ShortText({
                    displayName: 'Text',
                    required: false,
                }),
                number: Property.Number({
                    displayName: 'Number',
                    required: false,
                }),
            }

            const { errors } = await propsProcessor.applyProcessorsAndValidators(
                {
                    text: null,
                    number: undefined,
                },
                props,
                PieceAuth.None(),
                false,
                {},
            )
            expect(errors).toEqual({})
        })
    })

    describe('type validation', () => {
        it('should validate property types', async () => {
            const props = {
                string: Property.ShortText({
                    displayName: 'Text',
                    required: true,
                }),
                number: Property.Number({
                    displayName: 'Number',
                    required: true,
                }),
                boolean: Property.Checkbox({
                    displayName: 'Checkbox',
                    required: true,
                }),
                array: Property.Array({
                    displayName: 'Array',
                    required: true,
                }),
                object: Property.Object({
                    displayName: 'Object',
                    required: true,
                }),
            }

            const { errors } = await propsProcessor.applyProcessorsAndValidators(
                {
                    string: 42,
                    number: 'not a number',
                    boolean: 'not a boolean',
                    array: 'not an array',
                    object: 'not an object',
                },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(errors).toEqual({
                number: ['Expected number, received: not a number'],
                boolean: ['Expected boolean, received: not a boolean'],
                array: ['Expected array, received: not an array'],
                object: ['Expected object, received: not an object'],
            })
        })
    })

    describe('multi-select dropdown processing', () => {
        const props = {
            staticMultiSelect: Property.StaticMultiSelectDropdown({
                displayName: 'Static Multi Select',
                required: false,
                options: {
                    options: [
                        { label: 'Year', value: 'year' },
                        { label: 'Month', value: 'month' },
                    ],
                },
            }),
            multiSelect: Property.MultiSelectDropdown({
                displayName: 'Multi Select',
                required: false,
                refreshers: [],
                options: async () => ({ options: [] }),
            }),
        }

        it('should parse stringified arrays into arrays', async () => {
            const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
                {
                    staticMultiSelect: '[]',
                    multiSelect: '["year","month"]',
                },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(processedInput.staticMultiSelect).toEqual([])
            expect(processedInput.multiSelect).toEqual(['year', 'month'])
            expect(errors).toEqual({})
        })

        it('should pass arrays through unchanged', async () => {
            const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
                {
                    staticMultiSelect: ['year'],
                    multiSelect: ['month'],
                },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(processedInput.staticMultiSelect).toEqual(['year'])
            expect(processedInput.multiSelect).toEqual(['month'])
            expect(errors).toEqual({})
        })

        it('should pass non-array values through unchanged', async () => {
            const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
                {
                    staticMultiSelect: 'year',
                    multiSelect: '{"not":"an array"}',
                },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(processedInput.staticMultiSelect).toEqual('year')
            expect(processedInput.multiSelect).toEqual('{"not":"an array"}')
            expect(errors).toEqual({})
        })

        it('should pass nil values through unchanged', async () => {
            const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
                {
                    staticMultiSelect: null,
                    multiSelect: undefined,
                },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(processedInput.staticMultiSelect).toBeNull()
            expect(processedInput.multiSelect).toBeUndefined()
            expect(errors).toEqual({})
        })
    })

    describe('checkbox processing', () => {
        const props = {
            checkbox: Property.Checkbox({
                displayName: 'Checkbox',
                required: true,
            }),
        }

        it.each([
            ['true', true],
            ['false', false],
        ])('should parse stringified boolean %s', async (input, expected) => {
            const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
                { checkbox: input },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(processedInput.checkbox).toEqual(expected)
            expect(errors).toEqual({})
        })

        it('should pass booleans through unchanged', async () => {
            const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
                { checkbox: true },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(processedInput.checkbox).toEqual(true)
            expect(errors).toEqual({})
        })

        it('should leave non-boolean strings unchanged and fail validation', async () => {
            const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
                { checkbox: 'not a boolean' },
                props,
                PieceAuth.None(),
                false,
                {},
            )

            expect(processedInput.checkbox).toEqual('not a boolean')
            expect(errors).toEqual({
                checkbox: ['Expected boolean, received: not a boolean'],
            })
        })
    })
})
