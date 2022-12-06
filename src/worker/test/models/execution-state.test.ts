import {ExecutionState} from '../../src/model/execution/execution-state';
import {LoopOnItemsStepOutput} from '../../src/model/output/loop-on-items-step-output';

let executionState: ExecutionState;

describe('Execution State', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
  });

  test('Object is inserted to configs', () => {
    const configsObj = {
      foo: 'bar',
      num: 1,
      output: {
        message: 'test',
      },
      arr: [1, 2, 3],
    };

    executionState.insertConfigs(configsObj);

    expect(executionState.configs.size).toEqual(4);

    expect(executionState.configs.get('foo')).toEqual('bar');
    expect(executionState.configs.get('num')).toEqual(1);
    expect(executionState.configs.get('output')).toEqual({message: 'test'});
    expect(executionState.configs.get('arr')).toEqual([1, 2, 3]);
  });

  test('Map is inserted to configs', () => {
    const configsMap = new Map([
      ['foo', 'bar'],
      ['message', 'test'],
    ]);

    executionState.insertConfigs(configsMap);

    expect(executionState.configs.size).toEqual(2);

    expect(executionState.configs.get('foo')).toEqual('bar');
    expect(executionState.configs.get('message')).toEqual('test');
  });

  test('Array of objects is inserted to configs', () => {
    const configsArray = [{foo: 'bar'}, {message: null}];

    executionState.insertConfigs(configsArray);

    expect(executionState.configs.size).toEqual(2);

    expect(executionState.configs.get('foo')).toEqual('bar');
    expect(executionState.configs.get('message')).toEqual(null);
  });

  test('Invalid variable throws error when inserted to configs', () => {
    const invalidConfigs = [1, 'test'];

    expect(() => {
      executionState.insertConfigs(invalidConfigs);
    }).toThrow();
  });

  test('step output with no ancestors is inserted to steps', () => {
    const output = {
      output: 'test',
    };

    executionState.insertStep(output, 'trigger', []);

    expect(executionState.steps.get('trigger')).toEqual({output: 'test'});
  });

  test('step output with ancestors is inserted to loop step output', () => {
    const loopOutput: LoopOnItemsStepOutput = new LoopOnItemsStepOutput();
    loopOutput.iterations.push(new Map());

    const codeOutput = {
      output: 'test',
    };

    executionState.insertStep(loopOutput, 'loop', []);
    executionState.insertStep(codeOutput, 'code', [['loop', 0]]);

    expect(
      (
        executionState.steps.get('loop') as LoopOnItemsStepOutput
      ).iterations[0].get('code')
    ).toEqual({output: 'test'});
  });
});
