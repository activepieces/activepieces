import { Property } from '@activepieces/pieces-framework'
import { PropertyExecutionType } from '@activepieces/shared'
import { dynamicPropKeys } from '../../src/lib/helper/dynamic-prop-keys'
import { propsProcessor } from '../../src/lib/variables/props-processor'

describe('dynamicPropKeys', () => {
    it('escapes react-hook-form reserved characters reversibly', () => {
        const props = {
            'employee.firstName': Property.ShortText({ displayName: 'First name', required: true }),
            'columns[0]': Property.ShortText({ displayName: 'Column', required: false }),
            'weird~"\'key': Property.ShortText({ displayName: 'Weird', required: false }),
            'field~1name': Property.ShortText({ displayName: 'Literal token', required: false }),
            plain_key: Property.ShortText({ displayName: 'Plain', required: false }),
        }

        const escaped = dynamicPropKeys.escapePropsKeys(props)

        expect(Object.keys(escaped)).toEqual([
            '~ap~employee~1firstName',
            '~ap~columns~20~3',
            '~ap~weird~0~4~5key',
            '~ap~field~01name',
            'plain_key',
        ])
        expect(dynamicPropKeys.unescapePropsKeys(escaped)).toEqual(props)
    })

    it('never mutates keys that did not come from escapePropsKeys', () => {
        expect(dynamicPropKeys.unescapeInputKeys({ 'field~1name': 'raw' })).toEqual({ 'field~1name': 'raw' })
    })

    it('leaves non-object dynamic values untouched', () => {
        expect(dynamicPropKeys.unescapeInputKeys('{{trigger.body}}')).toEqual('{{trigger.body}}')
        expect(dynamicPropKeys.unescapeInputKeys(null)).toEqual(null)
    })
})

describe('DYNAMIC property input keys', () => {
    const props = {
        fields: Property.DynamicProperties({
            displayName: 'Fields',
            required: true,
            refreshers: [],
            props: async () => ({}),
        }),
    }

    it('hands the piece the original keys and validates against them', async () => {
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
            { fields: { '~ap~employee~1firstName': 'John', '~ap~employee~1age': '30' } },
            props,
            undefined,
            false,
            {
                fields: {
                    type: PropertyExecutionType.MANUAL,
                    schema: {
                        '~ap~employee~1firstName': Property.ShortText({ displayName: 'First name', required: true }),
                        '~ap~employee~1age': Property.Number({ displayName: 'Age', required: true }),
                    },
                },
            },
        )

        expect(processedInput.fields).toEqual({
            'employee.firstName': 'John',
            'employee.age': 30,
        })
        expect(errors).toEqual({})
    })

    it('reports child validation errors under the original keys', async () => {
        const { errors } = await propsProcessor.applyProcessorsAndValidators(
            { fields: { '~ap~employee~1firstName': null } },
            props,
            undefined,
            false,
            {
                fields: {
                    type: PropertyExecutionType.MANUAL,
                    schema: {
                        '~ap~employee~1firstName': Property.ShortText({ displayName: 'First name', required: true }),
                    },
                },
            },
        )

        expect(errors).toEqual({
            fields: { 'employee.firstName': ['Expected string, received: null'] },
        })
    })

    it('unescapes input keys even without a persisted schema', async () => {
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
            { fields: { '~ap~employee~1firstName': 'John' } },
            props,
            undefined,
            false,
            {},
        )

        expect(processedInput.fields).toEqual({ 'employee.firstName': 'John' })
        expect(errors).toEqual({})
    })
})
