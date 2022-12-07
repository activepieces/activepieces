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

    expect(Object.keys(executionState.configs).length).toEqual(4);

    expect(executionState.configs['foo']).toEqual('bar');
    expect(executionState.configs['num']).toEqual(1);
    expect(executionState.configs['output']).toEqual({message: 'test'});
    expect(executionState.configs['arr']).toEqual([1, 2, 3]);
  });

  test('Map is inserted to configs', () => {
    const configsMap = new Map([
      ['foo', 'bar'],
      ['message', 'test'],
    ]);

    executionState.insertConfigs(configsMap);

    expect(Object.keys(executionState.configs).length).toEqual(2);

    expect(executionState.configs['foo']).toEqual('bar');
    expect(executionState.configs['message']).toEqual('test');
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

    expect(executionState.steps['trigger']).toEqual({output: 'test'});
  });

  test('step output with ancestors is inserted to loop step output', () => {
    const loopOutput: LoopOnItemsStepOutput = new LoopOnItemsStepOutput();
    loopOutput.output!.iterations.push({});

    const codeOutput = {
      output: 'test',
    };

    executionState.insertStep(loopOutput, 'loop', []);
    executionState.insertStep(codeOutput, 'code', [['loop', 0]]);

    expect(
      (
        executionState.steps['loop'] as LoopOnItemsStepOutput
      ).output!.iterations[0]['code']
    ).toEqual({output: 'test'});
  });
});
