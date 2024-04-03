import { ApFile, PieceAuth, Property, Validators } from '@activepieces/pieces-framework'
import { ActionType, GenericStepOutput, StepOutputStatus, TriggerType } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { VariableService } from '../../src/lib/services/variable-service'

const variableService = new VariableService({
    projectId: 'PROJECT_ID',
    workerToken: 'WORKER_TOKEN',
})

const executionState = FlowExecutorContext.empty()
    .upsertStep(
        'trigger',
        GenericStepOutput.create({
            type: TriggerType.PIECE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: {
                items: [5, 'a'],
                name: 'John',
                price: 6.4,
            },
        }),
    )
    .upsertStep('step_1',
        GenericStepOutput.create({

            type: ActionType.PIECE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: {
                success: true,
            },
        }))
    .upsertStep('step_2', GenericStepOutput.create({
        type: ActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output: 'memory://{"fileName":"hello.png","data":"iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z"}',
    }))



describe('Variable Service', () => {
    test('Test resolve text with no variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: 'Hello world!', executionState })
        expect(resolvedInput).toEqual(
            'Hello world!',
        )
    })

    test('Test resolve text with double variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: 'Price is {{ trigger.price }}', executionState })
        expect(resolvedInput,
        ).toEqual('Price is 6.4')
    })

    test('Test resolve object steps variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{trigger}}', executionState })
        expect(resolvedInput).toEqual(
            {
                items: [5, 'a'],
                name: 'John',
                price: 6.4,
            },
        )
    })

    test('Test resolve steps variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{trigger.name}}', executionState })
        expect(resolvedInput).toEqual(
            'John',
        )
    })

    test('Test resolve multiple variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{trigger.name}} {{trigger.name}}', executionState })
        expect(
            resolvedInput,
        ).toEqual('John John')
    })

    test('Test resolve variable array items', async () => {
        const { resolvedInput } = await variableService.resolve({
            unresolvedInput:
                '{{trigger.items[0]}} {{trigger.items[1]}}',
            executionState,
        })
        expect(
            resolvedInput,
        ).toEqual('5 a')
    })

    test('Test resolve array variable', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{trigger.items}}', executionState })
        expect(resolvedInput).toEqual(
            [5, 'a'],
        )
    })

    test('Test resolve integer from variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{trigger.items[0]}}', executionState })
        expect(
            resolvedInput,
        ).toEqual(5)
    })

    test('Test resolve text with undefined variables', async () => {
        const { resolvedInput } = await variableService.resolve({
            unresolvedInput:
                'test {{configs.bar}} {{trigger.items[4]}}',
            executionState,
        })
        expect(
            resolvedInput,
        ).toEqual('test  ')
    })

    test('Test resolve empty text', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '', executionState })
        expect(resolvedInput).toEqual('')
    })


    test('Test resolve empty variable operator', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{}}', executionState })
        expect(resolvedInput).toEqual('')
    })

    test('Test resolve object', async () => {
        const { resolvedInput } = await variableService.resolve({
            unresolvedInput:
            {
                input: {
                    foo: 'bar',
                    nums: [1, 2, '{{trigger.items[0]}}'],
                    var: '{{trigger.price}}',
                },
            },
            executionState,
        })
        expect(
            resolvedInput,
        ).toEqual({ input: { foo: 'bar', nums: [1, 2, 5], var: 6.4 } })
    })

    test('Test resolve boolean from variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{step_1.success}}', executionState })
        expect(resolvedInput).toEqual(
            true,
        )
    })

    test('Test resolve addition from variables', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{trigger.price + 2 - 3}}', executionState })
        expect(resolvedInput).toEqual(
            6.4 + 2 - 3,
        )
    })

    test('Test resolve text with array variable', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: 'items are {{trigger.items}}', executionState })
        expect(
            resolvedInput,
        ).toEqual('items are [5,"a"]')
    })

    test('Test resolve text with object variable', async () => {
        const { resolvedInput } = await variableService.resolve({
            unresolvedInput:
                'values from trigger step: {{trigger}}',
            executionState,
        })
        expect(
            resolvedInput,
        ).toEqual('values from trigger step: {"items":[5,"a"],"name":"John","price":6.4}')
    })

    test('Test use built-in Math Min function', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{Math.min(trigger.price + 2 - 3, 2)}}', executionState })
        expect(resolvedInput).toEqual(
            2,
        )
    })

    test('Test use built-in Math Max function', async () => {
        const { resolvedInput } = await variableService.resolve({ unresolvedInput: '{{Math.max(trigger.price + 2, 2)}}', executionState })
        expect(resolvedInput).toEqual(
            8.4,
        )
    })

    it('should not compress memory file in native value in non-logs mode', async () => {
        const input = {
            base64: 'memory://{"fileName":"hello.png","data":"iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z"}',
        }
        const { resolvedInput } = await variableService.resolve({
            unresolvedInput: input,
            executionState,
        })
        expect(resolvedInput).toEqual({
            base64: 'memory://{"fileName":"hello.png","data":"iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z"}',
        })
    })

    it('should not compress memory file in referenced value in non-logs mode', async () => {
        const input = {
            base64: '{{step_2}}',
        }
        const { resolvedInput } = await variableService.resolve({
            unresolvedInput: input,
            executionState,
        })
        expect(resolvedInput).toEqual({
            base64: 'memory://{"fileName":"hello.png","data":"iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z"}',
        })
    })



    it('should return base64 from base64 with mime only', async () => {
        const input = {
            base64WithMime: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z',
            base64: 'iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z',
        }
        const props = {
            base64WithMime: Property.File({
                displayName: 'Base64',
                required: true,
            }),
            base64: Property.File({
                displayName: 'Base64',
                required: true,
            }),
        }
        const { processedInput, errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.None())
        expect(processedInput).toEqual({
            base64: null,
            base64WithMime: new ApFile('unknown.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z', 'base64'), 'png'),
        })
        expect(errors).toEqual({
            'base64': [
                'Expected file url or base64 with mimeType, but found value: iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z',
            ],
        })
    })

    // Test with invalid url
    it('should return error for invalid data', async () => {
        const input = {
            file: 'https://google.com',
            nullFile: null,
            nullOptionalFile: null,
        }
        const props = {
            file: Property.File({
                displayName: 'File',
                required: true,
            }),
            nullFile: Property.File({
                displayName: 'File',
                required: true,
            }),
            nullOptionalFile: Property.File({
                displayName: 'File',
                required: false,
            }),
        }
        const { processedInput, errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.None())
        expect(processedInput).toEqual({
            file: null,
            nullFile: null,
            nullOptionalFile: null,
        })
        expect(errors).toEqual({
            'file': ['Expected file url or base64 with mimeType, but found value: https://google.com'],
            'nullFile': [
                'Expected value, but found value: null',
            ],
        })
    })


    it('should return casted number for text', async () => {
        const input = {
            price: '0',
            auth: {
                age: '12',
            },
        }
        const props = {
            price: Property.Number({
                displayName: 'Price',
                required: true,
            }),
        }
        const { processedInput, errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.CustomAuth({
            required: true,
            props: {
                age: Property.Number({
                    displayName: 'age',
                    required: true,
                }),
            },
        }))

        expect(processedInput).toEqual({
            auth: {
                age: 12,
            },
            price: 0,
        })
        expect(errors).toEqual({})
    })

    it('should return errors for invalid number', async () => {
        const input = {
            price: 'wrong text',
            auth: {
                age: 'wrong text',
            },
            emptyStringNumber: '',
            undefinedNumber: undefined,
            nullNumber: null,
            optionalNullNumber: null,
            optionalUndefinedNumber: undefined,
        }
        const props = {
            emptyStringNumber: Property.Number({
                displayName: 'Empty String Number',
                required: true,
            }),
            optionalNullNumber: Property.Number({
                displayName: 'Null Number',
                required: false,
            }),
            optionalUndefinedNumber: Property.Number({
                displayName: 'Number',
                required: false,
            }),
            nullNumber: Property.Number({
                displayName: 'Null Number',
                required: true,
            }),
            undefinedNumber: Property.Number({
                displayName: 'Number',
                required: true,
            }),
            price: Property.Number({
                displayName: 'Price',
                required: true,
            }),
        }
        const { processedInput, errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.CustomAuth({
            required: true,
            props: {
                age: Property.Number({
                    displayName: 'age',
                    required: true,
                }),
            },
        }))
        expect(processedInput).toEqual({
            price: NaN,
            emptyStringNumber: NaN,
            nullNumber: null,
            undefinedNumber: undefined,
            optionalNullNumber: null,
            optionalUndefinedNumber: undefined,
            auth: {
                age: NaN,
            },
        })
        expect(errors).toEqual({
            price: ['Expected number, but found value: wrong text'],
            emptyStringNumber: ['Expected number, but found value: '],
            nullNumber: ['Expected value, but found value: null'],
            undefinedNumber: [
                'Expected value, but found value: undefined',
            ],
            auth: {
                age: ['Expected number, but found value: wrong text'],
            },
        })
    })

    it('should return proper iso date time for valid texts', async () => {
        const input = {
            Salesforce: '2022-12-27T09:48:06.000+0000',
            Microsoft1: '2022-12-14T02:30:00.0000000',
            Microsoft2: '2022-12-30T10:15:36.6778769Z',
            Asana1: '2012-02-22T02:06:58.147Z',
            Asana2: '2012-02-22',
            Hubspot: '2019-10-30T03:30:17.883Z',
            FormatOne: '2023-05-23Z',
            FormatTwo: 'May 23, 2023Z',
            FormatThree: '05/23/2023Z',
            FormatFour: '2023-05-23T12:34:56',
            FormatFive: '2023-05-23 12:34:56',
        }
        const props = {
            Salesforce: Property.DateTime({
                displayName: 'Salesforce',
                required: true,
            }),
            Microsoft1: Property.DateTime({
                displayName: 'Microsoft1',
                required: true,
            }),
            Microsoft2: Property.DateTime({
                displayName: 'Microsoft2',
                required: true,
            }),
            Asana1: Property.DateTime({
                displayName: 'Asana1',
                required: true,
            }),
            Asana2: Property.DateTime({
                displayName: 'Asana2',
                required: true,
            }),
            Hubspot: Property.DateTime({
                displayName: 'Hubspot',
                required: true,
            }),
            FormatOne: Property.DateTime({
                displayName: 'One',
                required: true,
            }),
            FormatTwo: Property.DateTime({
                displayName: 'One',
                required: true,
            }),
            FormatThree: Property.DateTime({
                displayName: 'One',
                required: true,
            }),
            FormatFour: Property.DateTime({
                displayName: 'One',
                required: true,
            }),
            FormatFive: Property.DateTime({
                displayName: 'One',
                required: true,
            }),
        }
        const { processedInput, errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.None())
        expect(processedInput).toEqual({
            Asana1: '2012-02-22T02:06:58.147Z',
            Asana2: '2012-02-22T00:00:00.000Z',
            FormatFive: '2023-05-23T12:34:56.000Z',
            FormatFour: '2023-05-23T12:34:56.000Z',
            FormatOne: '2023-05-23T00:00:00.000Z',
            FormatThree: '2023-05-23T00:00:00.000Z',
            FormatTwo: '2023-05-23T00:00:00.000Z',
            Hubspot: '2019-10-30T03:30:17.883Z',
            Microsoft1: '2022-12-14T02:30:00.000Z',
            Microsoft2: '2022-12-30T10:15:36.677Z',
            Salesforce: '2022-12-27T09:48:06.000Z',
        })
        expect(errors).toEqual({})
    })

    it('should return error for invalid texts for iso dates', async () => {
        const input = {
            invalidDateString: 'wrong text',
            wrongDateString: '2023-023-331',
            emptyDateString: '',
            undefinedDate: undefined,
            nullDate: null,
        }
        const props = {
            invalidDateString: Property.DateTime({
                displayName: 'Invalid Date String',
                required: true,
            }),
            wrongDateString: Property.DateTime({
                displayName: 'Wrong Date String',
                required: true,
            }),
            emptyDateString: Property.DateTime({
                displayName: 'Empty Date string',
                required: true,
            }),
            undefinedDate: Property.DateTime({
                displayName: 'Undefined Date string',
                required: true,
            }),
            nullDate: Property.DateTime({
                displayName: 'Null Number',
                required: true,
            }),
        }
        const { processedInput, errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.None())

        expect(processedInput).toEqual({
            invalidDateString: undefined,
            wrongDateString: undefined,
            emptyDateString: undefined,
            undefinedDate: undefined,
            nullDate: undefined,
        })
        expect(errors).toEqual({
            emptyDateString: ['Expected ISO string, but found value: '],
            invalidDateString: ['Expected ISO string, but found value: wrong text'],
            nullDate: ['Expected value, but found value: null'],
            undefinedDate: ['Expected value, but found value: undefined'],
            wrongDateString: ['Expected ISO string, but found value: 2023-023-331'],
        })
    })

    it('Test email validator', async () => {
        const input = {
            email: 'ap@dev&com',
            auth: {
                email: 'ap@dev&com',
            },
        }
        const props = {
            email: Property.LongText({
                displayName: 'Email',
                required: true,
                validators: [Validators.email],
            }),
        }
        const { errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.CustomAuth({
            required: true,
            props: {
                email: Property.LongText({
                    displayName: 'email',
                    required: true,
                    validators: [Validators.email],
                }),
            },
        }))
        expect(errors).toEqual({
            email: ['Invalid Email format: ap@dev&com'],
            auth: {
                email: ['Invalid Email format: ap@dev&com'],
            },
        })
    })

    it('Test url and oneOf validators', async () => {
        const input = {
            text: 'activepiecescom.',
        }
        const props = {
            text: Property.LongText({
                displayName: 'Text',
                required: true,
                validators: [Validators.url, Validators.oneOf(['activepieces.com', 'www.activepieces.com'])],
            }),
        }
        const { errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.None())
        expect(errors).toEqual({
            text: [
                'The value: activepiecescom. is not a valid URL',
                'The activepiecescom. is not a valid value, valid choices are: activepieces.com,www.activepieces.com',
            ],
        })
    })

    it('Test minLength and maxLength validators', async () => {
        const input = {
            textValid: 'short',
            text1: 'short',
            text2: 'short1234678923145678',
        }
        const props = {
            textValid: Property.LongText({
                displayName: 'Text',
                required: true,
                validators: [Validators.minLength(2)],
            }),
            text1: Property.LongText({
                displayName: 'Text',
                required: true,
                validators: [Validators.minLength(10)],
            }),
            text2: Property.LongText({
                displayName: 'Text',
                required: true,
                validators: [Validators.maxLength(10)],
            }),
        }
        const { errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.None())
        expect(errors).toEqual({
            text1: ['The value: short must be at least 10 characters'],
            text2: ['The value: short1234678923145678 may not be greater than 10 characters'],
        })
    })

    it('Test maxValue, inRange, minValue and oneOf valdiators', async () => {
        const choices = {
            VAL1: 1,
            VAL2: 2,
        }
        const input = {
            value1: 40,
            value2: 4,
            value3: 4,
        }
        const props = {
            value1: Property.Number({
                displayName: 'Age',
                required: true,
                validators: [Validators.maxValue(2), Validators.oneOf(Object.values(choices))],
            }),
            value2: Property.Number({
                displayName: 'Age',
                required: true,
                validators: [Validators.inRange(5, 10)],
            }),
            value3: Property.Number({
                displayName: 'Age',
                required: true,
                validators: [Validators.minValue(10)],
            }),
        }
        const { errors } = await variableService.applyProcessorsAndValidators(input, props, PieceAuth.None())
        expect(errors).toEqual({
            value1: ['The value: 40 must be 2 or less', 'The 40 is not a valid value, valid choices are: 1,2'],
            value2: ['The value: 4 must be at least 5 and less than or equal 10'],
            value3: ['The value: 4 must be 10 or more'],
        })
    })

})
