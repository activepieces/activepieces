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
  ExecuteCodeOperation,
  ExecuteExtractPieceMetadata,
  ExecuteValidateAuthOperation,
  extractPieceFromModule
} from '@activepieces/shared';
import { pieceHelper } from './lib/helper/action-helper';
import { triggerHelper } from './lib/helper/trigger-helper';
import { Piece } from '@activepieces/pieces-framework';

const initFlowExecutor = (input: ExecuteFlowOperation): FlowExecutor => {
  const { flowVersion } = input
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

const extractInformation = async (): Promise<void> => {
  try {
    const input: ExecuteExtractPieceMetadata = Utils.parseJsonFile(globals.inputFile);


    const pieceModule = await import(input.pieceName);
    const piece = extractPieceFromModule<Piece>({
      module: pieceModule,
      pieceName: input.pieceName,
      pieceVersion: input.pieceVersion
    })

    writeOutput({
      status: EngineResponseStatus.OK,
      response: piece.metadata()
    })
  } catch (e) {
    console.error(e);
    writeOutput({
      status: EngineResponseStatus.ERROR,
      response: (e as Error).message
    })
  }
}

const executeFlow = async (): Promise<void> => {
  try {
    const input: ExecuteFlowOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;
    globals.serverUrl = input.serverUrl!;
    globals.flowRunId = input.flowRunId;
    globals.flowVersionId = input.flowVersion.id;

    if (input.executionType === ExecutionType.RESUME) {
      globals.resumePayload = input.resumePayload;
    }

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
    const input: ExecuteActionOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;
    globals.serverUrl = input.serverUrl;

    const output = await pieceHelper.executeAction(input);
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

const executeValidateAuth = async (): Promise<void> => {
  try {
    const input: ExecuteValidateAuthOperation = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;

    const output = await pieceHelper.executeValidateAuth(input);

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
    case EngineOperationType.EXTRACT_PIECE_METADATA:
      extractInformation();
      break;
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
    case EngineOperationType.EXECUTE_VALIDATE_AUTH:
      executeValidateAuth();
      break;
    default:
      console.error('unknown operation');
      break;
  }
}

execute();
