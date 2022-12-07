import {ExecutionState} from './model/execution/execution-state';
import {FlowExecutor} from './executors/flow-executor';
import {Utils} from './utils';
import {StepOutput} from './model/output/step-output';
import {globals} from './globals';
import {StoreScope} from './model/util/store-scope';

function main() {
  try {
    const input: {
      flowVersionId: string;
      collectionVersionId: string;
      workerToken: string;
      apiUrl: string;
    } = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken;
    globals.apiUrl = input.apiUrl;
    const executionState = new ExecutionState();
    const context = Utils.parseJsonFile(globals.contextFile);
    const configs = Utils.parseJsonFile(globals.configsFile);
    const triggerPayload: StepOutput = StepOutput.deserialize(
      Utils.parseJsonFile(globals.triggerPayloadFile)
    );

    executionState.insertContext(context);
    executionState.insertStep(triggerPayload, 'trigger', []);

    const executor = new FlowExecutor(executionState);

    executor
      .executeFlow(
        input.collectionVersionId,
        input.flowVersionId,
        new StoreScope([]),
        configs
      )
      .then(output => {
        Utils.writeToJsonFile(globals.outputFile, output);
      });
  } catch (e) {
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

main();
