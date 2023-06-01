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
  ExecuteActionOperation,
  EngineResponse,
  EngineResponseStatus,
  TriggerHookType,
  ExecutionType,
  StepOutput,
  FlowVersion,
  ExecuteCodeOperation,
} from '@activepieces/shared';
import { pieceHelper } from './lib/helper/action-helper';
import { triggerHelper } from './lib/helper/trigger-helper';

const loadFlowVersion = (flowVersionId: string) => {
  const flowVersionJsonFile = `${globals.flowDirectory}/${flowVersionId}.json`
  const flowVersion: FlowVersion = Utils.parseJsonFile(flowVersionJsonFile)

  globals.flowId = flowVersion.id;

  return flowVersion
}

const initFlowExecutor = (input: ExecuteFlowOperation): FlowExecutor => {
  const flowVersion = loadFlowVersion(input.flowVersionId)
  const firstStep = flowVersion.trigger.nextAction

  if (input.executionType === ExecutionType.RESUME) {
    const { resumeStepMetadata } = input
    const executionState = new ExecutionState(input.executionState)

    return new FlowExecutor({
      executionState,
      firstStep,
      resumeStepMetadata,
    })
  }

  const executionState = new ExecutionState()
  executionState.insertStep(input.triggerPayload as StepOutput, 'trigger', []);

  return new FlowExecutor({
    executionState,
    firstStep,
  })
}

const executeFlow = async (): Promise<void> => {
  try {
    const input: ExecuteFlowOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const executor = initFlowExecutor(input)
    const output = await executor.safeExecute();

    writeOutput({
      status: EngineResponseStatus.OK,
      response: output
    })
  } catch (e) {
    console.error(e);
    writeOutput({
      status: EngineResponseStatus.ERROR,
      response: (e as Error).message
    })
  }
}

const executeProps = async (): Promise<void> => {
  try {
    const input: ExecutePropsOptions = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const output = await pieceHelper.executeProps(input);
    writeOutput({
      status: EngineResponseStatus.OK,
      response: output
    })
  }
  catch (e) {
    console.error(e);
    writeOutput({
      status: EngineResponseStatus.ERROR,
      response: (e as Error).message
    })
  }
}

const executeTrigger = async (): Promise<void> => {
  try {
    const input: ExecuteTriggerOperation<TriggerHookType> = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const output = await triggerHelper.executeTrigger(input);
    writeOutput({
      status: EngineResponseStatus.OK,
      response: output
    })
  }
  catch (e) {
    console.error(e);
    writeOutput({
      status: EngineResponseStatus.ERROR,
      response: (e as Error).message
    })
  }
}

const executeCode = async (): Promise<void> => {
  try {
    const operationInput: ExecuteCodeOperation = Utils.parseJsonFile(globals.inputFile);

    globals.projectId = operationInput.projectId;

  const output = await pieceHelper.executeCode(operationInput);
    writeOutput({
      status: EngineResponseStatus.OK,
      response: output
    })
  }
  catch (e) {
    console.error(e);
    writeOutput({
      status: EngineResponseStatus.ERROR,
      response: Utils.tryParseJson((e as Error).message)
    })
  }
}

const executeAction = async (): Promise<void> => {
  try {
    const operationInput: ExecuteActionOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = operationInput.workerToken!;
    globals.projectId = operationInput.projectId;
    globals.apiUrl = operationInput.apiUrl!;

  const output = await pieceHelper.executeAction(operationInput);
    writeOutput({
      status: EngineResponseStatus.OK,
      response: output
    })
  }
  catch (e) {
    console.error(e);
    writeOutput({
      status: EngineResponseStatus.ERROR,
      response: Utils.tryParseJson((e as Error).message)
    })
  }
}

async function writeOutput(result: EngineResponse<unknown>) {
  Utils.writeToJsonFile(globals.outputFile, result);
}

async function execute() {
  const operationType = argv[2]

  switch (operationType) {
    case EngineOperationType.EXECUTE_FLOW:
      executeFlow();
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
    case EngineOperationType.EXECUTE_CODE:
      executeCode();
      break;
    default:
      console.error('unknown operation');
      break;
  }
}

execute();
