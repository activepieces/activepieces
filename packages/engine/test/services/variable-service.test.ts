import { ActionType, ExecutionState, StepOutput, StepOutputStatus } from '@activepieces/shared';
import { VariableService } from '../../src/lib/services/variable-service';
import { Property } from '@activepieces/pieces-framework';

const variableService = new VariableService();

const executionState = new ExecutionState();

const stepOutput: StepOutput = {
  type: ActionType.PIECE,
  status: StepOutputStatus.SUCCEEDED,
  input: {},
  output: {
    items: [5, 'a'],
    name: 'John',
    price: 6.4,
  },
};
executionState.insertStep(
  stepOutput,
  'trigger',
  []
);

executionState.insertStep(
  {
    type: ActionType.PIECE,
    status: StepOutputStatus.SUCCEEDED,
    input: {},
    output: {
      success: true,
    }
  },
  "step_1",
  []
);

describe('Variable Service', () => {
  test('Test resolve text with no variables', async () => {
    expect(await variableService.resolve({ unresolvedInput: 'Hello world!', executionState, censorConnections: false })).toEqual(
      'Hello world!'
    );
  });

  test('Test resolve text with double variables', async () => {
    expect(
      await variableService.resolve({ unresolvedInput: 'Price is {{ trigger.price }}', executionState, censorConnections: false })
    ).toEqual('Price is 6.4');
  });

  test('Test resolve object steps variables', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{trigger}}', executionState, censorConnections: false })).toEqual(
      {
        items: [5, 'a'],
        name: 'John',
        price: 6.4,
      },
    );
  });

  test('Test resolve steps variables', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{trigger.name}}', executionState, censorConnections: false })).toEqual(
      'John'
    );
  });

  test('Test resolve multiple variables', async () => {
    expect(
      await variableService.resolve({ unresolvedInput: '{{trigger.name}} {{trigger.name}}', executionState, censorConnections: false })
    ).toEqual('John John');
  });

  test('Test resolve variable array items', async () => {
    expect(
      await variableService.resolve({ unresolvedInput:
        '{{trigger.items[0]}} {{trigger.items[1]}}',
        executionState,
        censorConnections: false,
      })
    ).toEqual('5 a');
  });

  test('Test resolve array variable', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{trigger.items}}', executionState, censorConnections: false })).toEqual(
      [5, 'a']
    );
  });

  test('Test resolve integer from variables', async () => {
    expect(
      await variableService.resolve({ unresolvedInput: '{{trigger.items[0]}}', executionState, censorConnections: false })
    ).toEqual(5);
  });

  test('Test resolve text with undefined variables', async () => {
    expect(
      await variableService.resolve({ unresolvedInput:
        'test {{configs.bar}} {{trigger.items[4]}}',
        executionState,
        censorConnections: false,
      })
    ).toEqual('test  ');
  });

  test('Test resolve empty text', async () => {
    expect(await variableService.resolve({ unresolvedInput: '', executionState, censorConnections: false })).toEqual('');
  });


  test('Test resolve empty variable operator', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{}}', executionState, censorConnections: false })).toEqual('');
  });

  test('Test resolve object', async () => {
    expect(
      await variableService.resolve({ unresolvedInput:
        {
          input: {
            foo: 'bar',
            nums: [1, 2, '{{trigger.items[0]}}'],
            var: '{{trigger.price}}',
          },
        },
        executionState,
        censorConnections: false,
      })
    ).toEqual({ input: { foo: 'bar', nums: [1, 2, 5], var: 6.4 } });
  });

  test('Test resolve boolean from variables', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{step_1.success}}', executionState, censorConnections: false })).toEqual(
      true
    );
  });

  test('Test resolve addition from variables', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{trigger.price + 2 - 3}}', executionState, censorConnections: false })).toEqual(
      6.4 + 2 - 3
    );
  });

  test('Test resolve text with array variable', async () => {
    expect(
      await variableService.resolve({ unresolvedInput: 'items are {{trigger.items}}', executionState, censorConnections: false })
    ).toEqual('items are [5,"a"]');
  });

  test('Test resolve text with object variable', async () => {
    expect(
      await variableService.resolve({ unresolvedInput:
        'values from trigger step: {{trigger}}',
        executionState,
        censorConnections: false,
      })
    ).toEqual('values from trigger step: {"items":[5,"a"],"name":"John","price":6.4}');
  });

  test('Test use built-in Math Min function', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{Math.min(trigger.price + 2 - 3, 2)}}', executionState, censorConnections: false })).toEqual(
      2
    );
  });

  test('Test use built-in Math Max function', async () => {
    expect(await variableService.resolve({ unresolvedInput: '{{Math.max(trigger.price + 2, 2)}}', executionState, censorConnections: false })).toEqual(
      8.4
    );
  });


  it('should return casted number for text', () => {
    const variableService = new VariableService();
    const input = {
      price: '0',
      auth: {
        age: '12'
      }
    };
    const props = {
      price: Property.Number({
        displayName: 'Price',
        required: true,
      }),
      auth: Property.CustomAuth({
        displayName: 'Auth',
        required: false,
        props: {
          age: Property.Number({
            displayName: 'age',
            required: true,
          })
        }
      })
    };
    const { result, errors } = variableService.validateAndCast(input, props);
    expect(result).toEqual({
      auth: {
        age: 12,
      },
      price: 0,
    });
    expect(errors).toEqual({});
  });

  it('should return errors for invalid number', () => {
    const variableService = new VariableService();
    const input = {
      price: 'wrong text',
      auth: {
        age: 'wrong text'
      },
      emptyStringNumber: '',
      undefinedNumber: undefined,
      nullNumber: null,
      optionalNullNumber: null,
      optionalUndefinedNumber: undefined,
    };
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
      auth: Property.CustomAuth({
        displayName: 'Auth',
        required: false,
        props: {
          age: Property.Number({
            displayName: 'age',
            required: true,
          })
        }
      })
    };
    const { result, errors } = variableService.validateAndCast(input, props);
    expect(result).toEqual({
      price: NaN,
      emptyStringNumber: NaN,
      nullNumber: null,
      undefinedNumber: undefined,
      optionalNullNumber: null,
      optionalUndefinedNumber: undefined,
      auth: {
        age: NaN,
      },
    });
    expect(errors).toEqual({
      price: 'expected number, but found value: wrong text',
      emptyStringNumber: "expected number, but found value: ",
      nullNumber: "expected number, but found value: null",
      undefinedNumber: "expected number, but found value: undefined",
      auth: {
        age: 'expected number, but found value: wrong text',
      },
    });
  });



});
