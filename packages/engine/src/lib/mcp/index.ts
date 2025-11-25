import { EngineResponseStatus, ExecuteToolResponse, ExecutionToolStatus, FlowActionType, McpRunStatus, PieceAction, PropertyExecutionType, StepOutput, StepOutputStatus } from "@activepieces/shared"
import { EngineResponse, ExecuteToolOperation } from "@activepieces/shared"
import { pieceLoader } from "../helper/piece-loader";
import { EngineConstants } from "../handler/context/engine-constants";
import { tsort } from "./tsort";
import { FlowExecutorContext } from "../handler/context/flow-execution-context";
import { flowExecutor } from "../handler/flow-executor";

export const toolOperation = {
    execute: async (operation: ExecuteToolOperation): Promise<EngineResponse<ExecuteToolResponse>> => {
        const input = operation as ExecuteToolOperation

        const { pieceAction } = await pieceLoader.getPieceAndActionOrThrow({
            pieceName: input.pieceName,
            pieceVersion: input.pieceVersion, actionName: input.actionName,
            devPieces: EngineConstants.DEV_PIECES
        });
        const depthToPropertyMap = tsort.sortPropertiesByDependencies(pieceAction.props)
        const resolvedInput = resolveProperties(depthToPropertyMap, input.instruction)

        const step: PieceAction = {
            name: input.actionName,
            displayName: input.actionName,
            type: FlowActionType.PIECE,
            settings: {
                input: resolvedInput,
                actionName: input.actionName,
                pieceName: input.pieceName,
                pieceVersion: input.pieceVersion,
                propertySettings: Object.fromEntries(Object.entries(resolvedInput).map(([key]) => [key, {
                    type: PropertyExecutionType.MANUAL,
                    schema: undefined,
                }])),
            },
            valid: true,
        }

        const output = await flowExecutor.getExecutorForAction(step.type).handle({
            action: step,
            executionState: FlowExecutorContext.empty(),
            constants: EngineConstants.fromExecuteActionInput(input),
        })

        const { output: stepOutput, errorMessage, status } = output.steps[step.name]

        return {
            status: EngineResponseStatus.OK,
            response: {
                status: status === StepOutputStatus.FAILED ? ExecutionToolStatus.FAILED : ExecutionToolStatus.SUCCESS,
                output: stepOutput,
                resolvedInput: resolvedInput,
                errorMessage: errorMessage,
            },
        }
    }
}

function resolveProperties(depthToPropertyMap: Record<number, string[]>, input: string): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [depth, properties] of Object.entries(depthToPropertyMap)) {
        for (const property of properties) {

        }
    }
    return result
}
