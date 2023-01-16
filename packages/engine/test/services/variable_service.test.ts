import {ExecutionState, StepOutput} from 'shared';
import {VariableService} from '../../src/services/variable-service';

const variableService = new VariableService();

const executionState = new ExecutionState();

executionState.insertConfigs({
  price: 6.4,
  msg: 'Hello World',
  foo: true,
});

let stepOutput: StepOutput = {
  output: {
    items: [5, 'a'],
    name: 'John',
  },
};
executionState.insertStep(
    stepOutput,
  'trigger',
  []
);

describe('Variable Service', () => {
  test('Test resolve text with no variables', async () => {
    expect(await variableService.resolve('Hello world!', executionState)).toEqual(
      'Hello world!'
    );
  });

  test('Test resolve configs variables', async () => {
    expect(await variableService.resolve('${configs.msg}', executionState)).toEqual(
      'Hello World'
    );
  });

  test('Test resolve text with configs variables', async () => {
    expect(
      variableService.resolve('Price is ${configs.price}', executionState)
    ).toEqual('Price is 6.4');
  });
  test('Test resolve object steps variables', async () => {
    expect(variableService.resolve('${trigger}', executionState)).toEqual(
        {
          items: [5, 'a'],
          name: 'John',
        },
    );
  });

  test('Test resolve steps variables', async () => {
    expect(variableService.resolve('${trigger.name}', executionState)).toEqual(
      'John'
    );
  });

  test('Test resolve multiple variables', async () => {
    expect(
      variableService.resolve('${configs.msg} ${trigger.name}', executionState)
    ).toEqual('Hello World John');
  });

  test('Test resolve variable array items',async () => {
    expect(
      variableService.resolve(
        '${trigger.items[0]} ${trigger.items[1]}',
        executionState
      )
    ).toEqual('5 a');
  });

  test('Test resolve array variable',async () => {
    expect(variableService.resolve('${trigger.items}', executionState)).toEqual(
      [5, 'a']
    );
  });

  test('Test resolve text with array variable',async () => {
    expect(
      variableService.resolve('items are ${trigger.items}', executionState)
    ).toEqual('items are [5,"a"]');
  });

  test('Test resolve object variable', async () => {
    expect(variableService.resolve('${trigger}', executionState)).toEqual({
      items: [5, 'a'],
      name: 'John',
    });
  });

  test('Test resolve text with object variable',async () => {
    expect(
      variableService.resolve(
        'values from trigger step: ${trigger}',
        executionState
      )
    ).toEqual('values from trigger step: {"items":[5,"a"],"name":"John"}');
  });

  test('Test resolve integer from variables', async () => {
    expect(
      variableService.resolve('${trigger.items[0]}', executionState)
    ).toEqual(5);
  });

  test('Test resolve double from variables', async () => {
    expect(await variableService.resolve('${configs.price}', executionState)).toEqual(
      6.4
    );
  });

  test('Test resolve boolean from variables', async () => {
    expect(await variableService.resolve('${configs.foo}', executionState)).toEqual(
      true
    );
  });

  test('Test resolve text with undefined variables', async () => {
    expect(
      await variableService.resolve(
        'test ${configs.bar} ${trigger.items[4]}',
        executionState
      )
    ).toEqual('test  ');
  });

  test('Test resolve empty variable operator', async () => {
    expect(await variableService.resolve('${}', executionState)).toEqual('');
  });

  test('Test resolve incorrect variable format', async () => {
    expect(await variableService.resolve('${configs.msg', executionState)).toEqual(
      '${configs.msg'
    );
  });

  test('Test resolve empty text', async () => {
    expect(await variableService.resolve('', executionState)).toEqual('');
  });

  test('Test resolve object', async () => {
    expect(
      await variableService.resolve(
        {
          input: {
            foo: 'bar',
            nums: [1, 2, '${trigger.items[0]}'],
            var: '${configs.price}',
          },
        },
        executionState
      )
    ).toEqual({input: {foo: 'bar', nums: [1, 2, 5], var: 6.4}});
  });

  test('Test resolve array',  async () => {
    expect(
      await  variableService.resolve([1, 'a', '${trigger.name}'], executionState)
    ).toEqual([1, 'a', 'John']);
  });
});
