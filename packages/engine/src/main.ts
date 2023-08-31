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
  extractPieceFromModule,
  flowHelper,
  EngineTestOperation,
  applyFunctionToValues
} from '@activepieces/shared';
import { pieceHelper } from './lib/helper/action-helper';
import { triggerHelper } from './lib/helper/trigger-helper';
import { Piece } from '@activepieces/pieces-framework';
import { VariableService } from './lib/services/variable-service';
import { testExecution } from './lib/helper/test-execution-context';
import { loggerUtils } from './lib/helper/logging-utils';

const initFlowExecutor = (input: ExecuteFlowOperation): FlowExecutor => {
  const { flowVersion } = input
  const firstStep = flowVersion.trigger.nextAction

  if (input.executionType === ExecutionType.RESUME) {
    const { resumeStepMetadata } = input
    const executionState = new ExecutionState(input.executionState)

    return new FlowExecutor({
      flowVersion,
      executionState,
      firstStep,
      resumeStepMetadata,
    })
  }

  const executionState = new ExecutionState(input.executionState)
  const variableService = new VariableService()

  const steps = flowHelper.getAllSteps(flowVersion.trigger);
  steps.forEach(step => {
    executionState.addConnectionTags(variableService.extractConnectionNames(step));
  })

  executionState.insertStep(input.triggerPayload as StepOutput, 'trigger', []);

  return new FlowExecutor({
    flowVersion,
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

const executeFlow = async (input?: ExecuteFlowOperation): Promise<void> => {
  try {
    input = input ?? Utils.parseJsonFile(globals.inputFile) as ExecuteFlowOperation

    globals.workerToken = input.workerToken!;
    globals.projectId = input.projectId;
    globals.apiUrl = input.apiUrl!;
    globals.serverUrl = input.serverUrl!;
    globals.flowRunId = input.flowRunId;

    if (input.executionType === ExecutionType.RESUME) {
      globals.resumePayload = input.resumePayload;
    }

    const executor = initFlowExecutor(input)
    const output = await executor.safeExecute();

    writeOutput({
      status: EngineResponseStatus.OK,
      response: await loggerUtils.trimExecution(output)
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

const executeTest = async (): Promise<void> => {
  try {
    const input: EngineTestOperation = Utils.parseJsonFile(globals.inputFile);

    const testExecutionState = await testExecution.stateFromFlowVersion({
      flowVersion: input.sourceFlowVersion,
    })

    await executeFlow({
      ...input,
      executionState: testExecutionState,
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
    case EngineOperationType.EXECUTE_TEST:
      executeTest()
      break
    default:
      console.error('unknown operation');
      break;
  }
}

execute();
