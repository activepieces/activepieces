import {ExecutionState} from '../../src/model/execution/execution-state';
import {StepOutputStatus} from '../../src/model/output/step-output';
import {FlowExecutor} from '../../src/executors/flow-executor';
import {ActionType, LoopOnItemsAction} from "@activepieces/shared";
import {LoopOnItemActionHandler} from "../../src/action/loop-action-handler";
import {createAction} from "../../src/action/action-factory";

let executionState: ExecutionState;

describe('Loop Action', () => {
  beforeEach(() => {
    executionState = new ExecutionState();
    executionState.insertStep({
      output: {
        items: ["one", "two"]
      }
    }, 'trigger', []);
  });

  test('Loop action is executed', async () => {
    const loopAction: LoopOnItemsAction = {
      name: 'LOOP_ON_ITEMS_ACTION',
      displayName: 'LOOP_ON_ITEMS_ACTION',
      type: ActionType.LOOP_ON_ITEMS,
      settings: {
        items: '${trigger.items}'
      },
      firstLoopAction: undefined,
      valid: false,
      nextAction: undefined
    }

    const loopActionHandler = new LoopOnItemActionHandler(loopAction, undefined, createAction(loopAction.nextAction));

    jest
      .spyOn(FlowExecutor.prototype, 'iterateFlow')
      .mockImplementation(() => Promise.resolve(true));

    const stepOutput = await loopActionHandler.execute(executionState, []);

    console.log(JSON.stringify(stepOutput));
    expect(stepOutput.status).toEqual(StepOutputStatus.SUCCEEDED);
    expect(stepOutput.output).toEqual({
      current_item: "two",
      current_iteration: 2,
      iterations: [
        {},
        {}
      ]
    });
    expect(stepOutput.errorMessage).toBeUndefined();
  });

  test('Loop action is fails on error and stops', async () => {
    const loopAction: LoopOnItemsAction = {
      name: 'LOOP_ON_ITEMS_ACTION',
      displayName: 'LOOP_ON_ITEMS_ACTION',
      type: ActionType.LOOP_ON_ITEMS,
      settings: {
        items: '${trigger.items}'
      },
      firstLoopAction: {
        type: ActionType.CODE,
        name: 'CODE_ACTION',
        valid: false,
        displayName: 'CODE_ACTION',
        settings: {
          artifactPackagedId: 'artifact.zip',
          input: {},
          artifactSourceId: 'artifact.zip'
        },
        nextAction: undefined
      },
      valid: false,
      nextAction: undefined
    }

    const loopActionHandler = new LoopOnItemActionHandler(loopAction, createAction(loopAction.firstLoopAction), createAction(loopAction.nextAction));

    jest
      .spyOn(FlowExecutor.prototype, 'iterateFlow')
      .mockImplementation(() => Promise.resolve(false));


    const stepOutput = await loopActionHandler.execute(executionState, []);

    expect(stepOutput.input).toEqual({
      items: ["one", "two"]
    })
    expect(stepOutput.status).toEqual(StepOutputStatus.FAILED);
    expect(stepOutput.output).toEqual({
      current_item: "one",
      current_iteration: 1,
      iterations: [
        {}
      ]
    });
  });
});
