import { ApFile, PieceAuth, Property } from '@activepieces/pieces-framework'
import { ActionType, GenericStepOutput, StepOutputStatus, TriggerType } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { StepExecutionPath } from '../../src/lib/handler/context/step-execution-path'
import { propsProcessor } from '../../src/lib/variables/props-processor'
import { createPropsResolver } from '../../src/lib/variables/props-resolver'

const propsResolverService = createPropsResolver({
    projectId: 'PROJECT_ID',
    engineToken: 'WORKER_TOKEN',
    apiUrl: 'http://127.0.0.1:3000',
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



describe('Props resolver', () => {
    test('Test resolve inside nested loops', async () => {

        const modifiedExecutionState = executionState.upsertStep('step_3', GenericStepOutput.create({
            type: ActionType.LOOP_ON_ITEMS,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: {
                iterations: [
                    {
                        'step_8': GenericStepOutput.create({
                            type: ActionType.PIECE,
                            status: StepOutputStatus.SUCCEEDED,
                            input: {},
                            output: {
                                delayForInMs: 20000,
                                success: true,
                            },
                        }),
                        'step_4': GenericStepOutput.create({
                            type: ActionType.LOOP_ON_ITEMS,
                            status: StepOutputStatus.SUCCEEDED,
                            input: {},
                            output: {
                                iterations: [
                                    {
                                        'step_7': GenericStepOutput.create({
                                            'type': ActionType.PIECE,
                                            'status': StepOutputStatus.SUCCEEDED,
                                            'input': {
                                                'unit': 'seconds',
                                                'delayFor': '20',
                                            },
                                            'output': {
                                                'delayForInMs': 20000,
                                                'success': true,
                                            },
                                        }),
                                    },
                                ],
                                item: 1,
                                index: 0,
                            },
                        }),
                    },
                ],
                item: 1,
                index: 0,
            },
        })).setCurrentPath(StepExecutionPath.empty()
            .loopIteration({
                loopName: 'step_3',
                iteration: 0,
            })
            .loopIteration({
                loopName: 'step_4',
                iteration: 0,
            }),
        )

        const { resolvedInput: secondLevelResolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{step_7.delayForInMs}}', executionState: modifiedExecutionState })
        expect(secondLevelResolvedInput).toEqual(20000)
        const { resolvedInput: firstLevelResolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{step_8.delayForInMs}}', executionState: modifiedExecutionState })
        expect(firstLevelResolvedInput).toEqual(20000)

    })
    test('Test resolve text with no variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: 'Hello world!', executionState })
        expect(resolvedInput).toEqual(
            'Hello world!',
        )
    })

    test('Test resolve text with double variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: 'Price is {{ trigger.price }}', executionState })
        expect(resolvedInput,
        ).toEqual('Price is 6.4')
    })


    test('Test resolve object steps variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{ {"where": "a"} }}', executionState })
        expect(resolvedInput).toEqual(
            {
                where: 'a',
            },
        )
    })

    test('Test resolve object steps variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{trigger}}', executionState })
        expect(resolvedInput).toEqual(
            {
                items: [5, 'a'],
                name: 'John',
                price: 6.4,
            },
        )
    })

    test('Test resolve steps variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{trigger.name}}', executionState })
        expect(resolvedInput).toEqual(
            'John',
        )
    })

    test('Test resolve multiple variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{trigger.name}} {{trigger.name}}', executionState })
        expect(
            resolvedInput,
        ).toEqual('John John')
    })

    test('Test resolve variable array items', async () => {
        const { resolvedInput } = await propsResolverService.resolve({
            unresolvedInput:
                '{{trigger.items[0]}} {{trigger.items[1]}}',
            executionState,
        })
        expect(
            resolvedInput,
        ).toEqual('5 a')
    })

    test('Test resolve array variable', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{trigger.items}}', executionState })
        expect(resolvedInput).toEqual(
            [5, 'a'],
        )
    })

    test('Test resolve integer from variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{trigger.items[0]}}', executionState })
        expect(
            resolvedInput,
        ).toEqual(5)
    })

    test('Test resolve text with undefined variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({
            unresolvedInput:
                'test {{configs.bar}} {{trigger.items[4]}}',
            executionState,
        })
        expect(
            resolvedInput,
        ).toEqual('test  ')
    })

    test('Test resolve empty text', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '', executionState })
        expect(resolvedInput).toEqual('')
    })


    test('Test resolve empty variable operator', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{}}', executionState })
        expect(resolvedInput).toEqual('')
    })

    test('Test resolve object', async () => {
        const { resolvedInput } = await propsResolverService.resolve({
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
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{step_1.success}}', executionState })
        expect(resolvedInput).toEqual(
            true,
        )
    })

    test('Test resolve addition from variables', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{trigger.price + 2 - 3}}', executionState })
        expect(resolvedInput).toEqual(
            6.4 + 2 - 3,
        )
    })

    test('Test resolve text with array variable', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: 'items are {{trigger.items}}', executionState })
        expect(
            resolvedInput,
        ).toEqual('items are [5,"a"]')
    })

    test('Test resolve text with object variable', async () => {
        const { resolvedInput } = await propsResolverService.resolve({
            unresolvedInput:
                'values from trigger step: {{trigger}}',
            executionState,
        })
        expect(
            resolvedInput,
        ).toEqual('values from trigger step: {"items":[5,"a"],"name":"John","price":6.4}')
    })

    test('Test use built-in Math Min function', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{Math.min(trigger.price + 2 - 3, 2)}}', executionState })
        expect(resolvedInput).toEqual(
            2,
        )
    })

    test('Test use built-in Math Max function', async () => {
        const { resolvedInput } = await propsResolverService.resolve({ unresolvedInput: '{{Math.max(trigger.price + 2, 2)}}', executionState })
        expect(resolvedInput).toEqual(
            8.4,
        )
    })

    it('should not compress memory file in native value in non-logs mode', async () => {
        const input = {
            base64: 'memory://{"fileName":"hello.png","data":"iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z"}',
        }
        const { resolvedInput } = await propsResolverService.resolve({
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
        const { resolvedInput } = await propsResolverService.resolve({
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
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(input, props, PieceAuth.None(), false)
        expect(processedInput).toEqual({
            base64: null,
            base64WithMime: new ApFile('unknown.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z', 'base64'), 'png'),
        })
        expect(errors).toEqual({
            'base64': [
                'Expected file url or base64 with mimeType, received: iVBORw0KGgoAAAANSUhEUgAAAiAAAAC4CAYAAADaI1cbAAA0h0lEQVR4AezdA5AlPx7A8Zxt27Z9r5PB2SidWTqbr26S9Hr/tm3btu3723eDJD3r15ec17vzXr+Z',
            ],
        })
    })

    it('should resolve files inside the array properties', async () => {
        const input = {
            documents: [
                {
                    file: 'https://cdn.activepieces.com/brand/logo.svg?token=123',
                },
            ],
        }
        const props = {
            documents: Property.Array({
                displayName: 'Documents',
                required: true,
                properties: {
                    file: Property.File({
                        displayName: 'File',
                        required: true,
                    }),
                },
            }),
        }

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(input, props, PieceAuth.None(), false)
        expect(processedInput.documents[0].file).toBeDefined()
        expect(processedInput.documents[0].file.extension).toBe('svg')
        expect(processedInput.documents[0].file.filename).toBe('logo.svg')
        expect(errors).toEqual({})
    })

    it('should return error for invalid file inside the array properties', async () => {
        const input = {
            documents: [
                {
                    file: 'invalid-url',
                },
            ],
        }
        const props = {
            documents: Property.Array({
                displayName: 'Documents',
                required: true,
                properties: {
                    file: Property.File({
                        displayName: 'File',
                        required: true,
                    }),
                },
            }),
        }

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(input, props, PieceAuth.None(), false)
        expect(processedInput.documents[0].file).toBeNull()
        expect(errors).toEqual({
            'documents': {
                properties: [{
                    file: [
                        'Expected file url or base64 with mimeType, received: invalid-url',
                    ],
                }],
            },
        })
    })
    it('should return images for image url', async () => {
        const input = {
            file: 'https://cdn.activepieces.com/brand/logo.svg?token=123',
        }
        const props = {
            file: Property.File({
                displayName: 'File',
                required: true,
            }),

        }
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(input, props, PieceAuth.None(), false)
        expect(processedInput.file).toBeDefined()
        expect(processedInput.file.extension).toBe('svg')
        expect(processedInput.file.filename).toBe('logo.svg')
        expect(errors).toEqual({})
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
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(input, props, PieceAuth.None(), false)

        expect(processedInput.file).toBeDefined()
        expect(processedInput.file.extension).toBe('html')
        expect(processedInput.file.filename).toBe('unknown.html')
        expect(processedInput.nullFile).toBeNull()
        expect(processedInput.nullOptionalFile).toBeNull()

        expect(errors).toEqual({
            'nullFile': [
                'Expected file url or base64 with mimeType, received: null',
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

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(input, {
            price: Property.Number({
                displayName: 'Price',
                required: true,
            }),
        }, PieceAuth.CustomAuth({
            required: true,
            props: {
                age: Property.Number({
                    displayName: 'age',
                    required: true,
                }),
            },
        }), true)

        expect(processedInput).toEqual({
            auth: {
                age: 12,
            },
            price: 0,
        })
        expect(errors).toEqual({})
    })

    it('should not error if auth configured, but no auth provided in input', async () => {
        const input = {
            price: '0',
        }
        const props = {
            price: Property.Number({
                displayName: 'Price',
                required: true,
            }),
        }
        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(input, props, PieceAuth.CustomAuth({
            required: true,
            props: {},
        }), false)

        expect(processedInput).toEqual({
            price: 0,
        })
        expect(errors).toEqual({})
    })


})
