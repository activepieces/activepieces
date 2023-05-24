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

    it('should return proper iso date time for valid texts', () => {
      const variableService = new VariableService();
      const input = {
        Salesforce: '2022-12-27T09:48:06.000+0000',
        Microsoft1: '2022-12-14T02:30:00.0000000',
        Microsoft2: '2022-12-30T10:15:36.6778769Z',
        Asana1: '2012-02-22T02:06:58.147Z',
        Asana2: '2012-02-22',
        Hubspot: '2019-10-30T03:30:17.883Z',
        FormatOne: '2023-05-23',
        FormatTwo: 'May 23, 2023',
        FormatThree: '05/23/2023',
        FormatFour: '2023-05-23T12:34:56',
        FormatFive: '2023-05-23 12:34:56',
      };
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
      };
      const { result, errors } = variableService.validateAndCast(input, props);
      expect(result).toEqual({
        Asana1: '2012-02-22T02:06:58.147Z',
        Asana2: '2012-02-22T00:00:00.000Z',
        FormatFive: '2023-05-23T12:34:56.000Z',
        FormatFour: '2023-05-23T12:34:56.000Z',
        FormatOne: '2023-05-23T00:00:00.000Z',
        FormatThree: '2023-05-22T18:30:00.000Z',
        FormatTwo: '2023-05-22T18:30:00.000Z',
        Hubspot: '2019-10-30T03:30:17.883Z',
        Microsoft1: '2022-12-14T02:30:00.000Z',
        Microsoft2: '2022-12-30T10:15:36.677Z',
        Salesforce: '2022-12-27T09:48:06.000Z',
      });
      expect(errors).toEqual({});
    });

    it('should return error for invalid texts for iso dates', () => {
      const variableService = new VariableService();
      const input = {
        invalidDateString: 'wrong text',
        wrongDateString: '2023-023-331',
        emptyStringNumber: '',
        undefinedNumber: undefined,
        nullNumber: null,
      };
      const props = {
        invalidDateString: Property.DateTime({
          displayName: 'Invalid Date String',
          required: true,
        }),
        wrongDateString: Property.DateTime({
          displayName: 'Wrong Date String',
          required: true,
        }),
        emptyStringNumber: Property.DateTime({
          displayName: 'Empty String Number',
          required: true,
        }),
        undefinedNumber: Property.DateTime({
          displayName: 'Undefined Number',
          required: true,
        }),
        nullNumber: Property.DateTime({
          displayName: 'Null Number',
          required: true,
        }),
      };
      const { result, errors } = variableService.validateAndCast(input, props);
      expect(result).toEqual({
        emptyStringNumber: undefined,
        invalidDateString: undefined,
        nullNumber: undefined,
        undefinedNumber: undefined,
        wrongDateString: undefined,
      });
      expect(errors).toEqual({
        emptyStringNumber: 'expected ISO string, but found value: ',
        invalidDateString: 'expected ISO string, but found value: wrong text',
        nullNumber: 'expected ISO string, but found value: null',
        undefinedNumber: 'expected ISO string, but found value: undefined',
        wrongDateString: 'expected ISO string, but found value: 2023-023-331',
      });
    });

});
