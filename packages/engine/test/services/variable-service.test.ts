import { ExecutionState, StepOutput } from '@activepieces/shared';
import { VariableService } from '../../src/lib/services/variable-service';

const variableService = new VariableService();

const executionState = new ExecutionState();

const stepOutput: StepOutput = {
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
    output: {
      success: true,
    }
  },
  "step_1",
  []
);

describe('Variable Service', () => {
  test('Test resolve text with no variables', async () => {
    expect(await variableService.resolve('Hello world!', executionState)).toEqual(
      'Hello world!'
    );
  });

  test('Test resolve text with double variables', async () => {
    expect(
      await variableService.resolve('Price is {{ trigger.price }}', executionState)
    ).toEqual('Price is 6.4');
  });

  test('Test resolve object steps variables', async () => {
    expect(await variableService.resolve('{{trigger}}', executionState)).toEqual(
      {
        items: [5, 'a'],
        name: 'John',
        price: 6.4,
      },
    );
  });

  test('Test resolve steps variables', async () => {
    expect(await variableService.resolve('{{trigger.name}}', executionState)).toEqual(
      'John'
    );
  });

  test('Test resolve multiple variables', async () => {
    expect(
      await variableService.resolve('{{trigger.name}} {{trigger.name}}', executionState)
    ).toEqual('John John');
  });

  test('Test resolve variable array items', async () => {
    expect(
      await variableService.resolve(
        '{{trigger.items[0]}} {{trigger.items[1]}}',
        executionState
      )
    ).toEqual('5 a');
  });

  test('Test resolve array variable', async () => {
    expect(await variableService.resolve('{{trigger.items}}', executionState)).toEqual(
      [5, 'a']
    );
  });

  test('Test resolve integer from variables', async () => {
    expect(
      await variableService.resolve('{{trigger.items[0]}}', executionState)
    ).toEqual(5);
  });

  test('Test resolve text with undefined variables', async () => {
    expect(
      await variableService.resolve(
        'test {{configs.bar}} {{trigger.items[4]}}',
        executionState
      )
    ).toEqual('test  ');
  });

  test('Test resolve empty text', async () => {
    expect(await variableService.resolve('', executionState)).toEqual('');
  });


  test('Test resolve empty variable operator', async () => {
    expect(await variableService.resolve('{{}}', executionState)).toEqual('');
  });

  test('Test resolve object', async () => {
    expect(
      await variableService.resolve(
        {
          input: {
            foo: 'bar',
            nums: [1, 2, '{{trigger.items[0]}}'],
            var: '{{trigger.price}}',
          },
        },
        executionState
      )
    ).toEqual({ input: { foo: 'bar', nums: [1, 2, 5], var: 6.4 } });
  });

  test('Test resolve boolean from variables', async () => {
    expect(await variableService.resolve('{{step_1.success}}', executionState)).toEqual(
      true
    );
  });

  test('Test resolve addition from variables', async () => {
    expect(await variableService.resolve('{{trigger.price + 2 - 3}}', executionState)).toEqual(
      6.4 + 2 - 3
    );
  });

  test('Test resolve text with array variable', async () => {
    expect(
      await variableService.resolve('items are {{trigger.items}}', executionState)
    ).toEqual('items are [5,"a"]');
  });

  test('Test resolve text with object variable', async () => {
    expect(
      await variableService.resolve(
        'values from trigger step: {{trigger}}',
        executionState
      )
    ).toEqual('values from trigger step: {"items":[5,"a"],"name":"John","price":6.4}');
  });

  test('Test use built-in Math Min function', async () => {
    expect(await variableService.resolve('{{Math.min(trigger.price + 2 - 3, 2)}}', executionState)).toEqual(
      2
    );
  });

  test('Test use built-in Math Max function', async () => {
    expect(await variableService.resolve('{{Math.max(trigger.price + 2, 2)}}', executionState)).toEqual(
      8.4
    );
  });

});