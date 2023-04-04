import { argv } from 'node:process'
import { FlowExecutor } from './lib/executors/flow-executor';
import { Utils } from './lib/utils';
import { globals } from './lib/globals';
import {
  EngineOperationType,
  ExecutePropsOptions,
  ExecuteFlowOperation,
  ExecuteTriggerOperation,
  ExecutionState,
  ExecuteEventParserOperation,
  ExecuteActionOperation,
} from '@activepieces/shared';
import { pieceHelper } from './lib/helper/piece-helper';
import { triggerHelper } from './lib/helper/trigger-helper';

const executeFlow = async (): Promise<void> => {
  try {
    const input: ExecuteFlowOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const executionState = new ExecutionState();
    executionState.insertStep(input.triggerPayload!, 'trigger', []);
    const executor = new FlowExecutor(executionState);
    const output = await executor.executeFlow(input.flowVersionId);
    Utils.writeToJsonFile(globals.outputFile, output);
  } catch (e) {
    console.error(e);
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

const executeProps = async (): Promise<void> => {
  try {
    const input: ExecutePropsOptions = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const output = await pieceHelper.executeProps(input);
    Utils.writeToJsonFile(globals.outputFile, output);
  }
  catch (e) {
    console.error(e);
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

const executeEventParser = async (): Promise<void> => {
  const input: ExecuteEventParserOperation = Utils.parseJsonFile(globals.inputFile);

  try {
    const output = await triggerHelper.executeEventParser(input)
    Utils.writeToJsonFile(globals.outputFile, output);
  }
  catch (e) {
    console.error(e);
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

const executeTrigger = async (): Promise<void> => {
  try {
    const input: ExecuteTriggerOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const output = await triggerHelper.executeTrigger(input);
    Utils.writeToJsonFile(globals.outputFile, output ?? "");
  }
  catch (e) {
    console.error(e);
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

const executeAction = async (): Promise<void> => {
  try {
    const operationInput: ExecuteActionOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = operationInput.workerToken!;
    globals.projectId = operationInput.projectId;
    globals.apiUrl = operationInput.apiUrl!;

    const output = await pieceHelper.executeAction(operationInput);
    Utils.writeToJsonFile(globals.outputFile, output ?? "");
  }
  catch (e) {
    console.error(e);
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

async function execute() {
  const operationType = argv[2]

  switch (operationType) {
    case EngineOperationType.EXECUTE_FLOW:
      executeFlow();
      break;
    case EngineOperationType.EXTRACT_EVENT_DATA:
      executeEventParser();
      break;
    case EngineOperationType.EXECUTE_PROPERTY:
      executeProps();
      break;
    case EngineOperationType.EXECUTE_TRIGGER_HOOK:
      executeTrigger();
      break;
    case EngineOperationType.EXECUTE_ACTION:
      executeAction();
      break;
    default:
      console.error('unknown operation');
      break;
  }
}

execute();
