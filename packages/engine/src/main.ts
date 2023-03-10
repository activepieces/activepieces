import { FlowExecutor } from './lib/executors/flow-executor';
import { Utils } from './lib/utils';
import { globals } from './lib/globals';
import { EngineOperationType, ExecutePropsOptions, ExecuteFlowOperation, ExecuteTriggerOperation, ExecutionState } from '@activepieces/shared';
import { pieceHelper } from './lib/helper/piece-helper';
import { triggerHelper } from './lib/helper/trigger-helper';

const args = process.argv.slice(2);

function executeFlow() {
  try {
    const input: ExecuteFlowOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const executionState = new ExecutionState();
    executionState.insertStep(input.triggerPayload!, 'trigger', []);
    const executor = new FlowExecutor(executionState);
    executor
      .executeFlow(input.flowVersionId)
      .then((output) => {
        Utils.writeToJsonFile(globals.outputFile, output);
      });
  } catch (e) {
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

function executeProps() {
  const input: ExecutePropsOptions = Utils.parseJsonFile(globals.inputFile);

  globals.workerToken = input.workerToken!;
  globals.projectId = input.projectId;
  globals.apiUrl = input.apiUrl!;

  pieceHelper.executeProps(input).then((output) => {
    Utils.writeToJsonFile(globals.outputFile, output);
  }).catch(e => {
    console.error(e);
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  });;

}

function executeTrigger() {
  const input: ExecuteTriggerOperation = Utils.parseJsonFile(globals.inputFile);

  globals.workerToken = input.workerToken!;
  globals.projectId = input.projectId;
  globals.apiUrl = input.apiUrl!;

  triggerHelper.executeTrigger(input).then((output) => {
    Utils.writeToJsonFile(globals.outputFile, output ?? "");
  }).catch(e => {
    console.error(e);
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  });

}

async function execute() {
  switch (args[0]) {
    case EngineOperationType.EXECUTE_FLOW:
      executeFlow();
      break;
    case EngineOperationType.EXECUTE_PROPERTY:
      executeProps();
      break;
    case EngineOperationType.EXECUTE_TRIGGER_HOOK:
      executeTrigger();
      break;
    default:
      break;
  }
}

execute();
