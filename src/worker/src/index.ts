import {ExecutionState} from './model/execution/execution-state';
import {FlowExecutor} from './executors/flow-executor';
import {Utils} from './utils';
import {StepOutput} from './model/output/step-output';
import {globals} from './globals';

function main() {
  try {
    const input = Utils.parseJsonFile(globals.inputFile);

    const executionState = new ExecutionState();
    const configs = Utils.parseJsonFile(globals.configsFile);
    const triggerPayload = StepOutput.deserialize(
      Utils.parseJsonFile(globals.triggerPayloadFile)
    );

    executionState.insertConfigs(configs);
    executionState.insertStep(triggerPayload, 'trigger', []);

    const executor = new FlowExecutor(executionState);

    executor.executeFlow(input.collectionId, input.flowId).then(output => {
      Utils.writeToJsonFile(globals.outputFile, output);
    });
  } catch (e) {
    Utils.writeToJsonFile(globals.outputFile, e);
  }
}

main();
