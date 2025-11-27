import { assertNotNullOrUndefined, EngineResponseStatus, ExecuteToolResponse, ExecutionToolStatus, FlowActionType, McpRunStatus, PieceAction, PropertyExecutionType, StepOutput, StepOutputStatus } from "@activepieces/shared"
import { EngineResponse, ExecuteToolOperation } from "@activepieces/shared"
import { pieceLoader } from "../helper/piece-loader";
import { EngineConstants } from "../handler/context/engine-constants";
import { tsort } from "./tsort";
import { FlowExecutorContext } from "../handler/context/flow-execution-context";
import { flowExecutor } from "../handler/flow-executor";
import { Action, ActionBase, PropertyType } from "@activepieces/pieces-framework";
import { z } from "zod/v4";
import { generateObject, LanguageModel } from "ai";

export const mcpExecutor = {
    execute: async (operation: ExecuteToolOperationWithModel): Promise<EngineResponse<ExecuteToolResponse>> => {

        const { pieceAction } = await pieceLoader.getPieceAndActionOrThrow({
            pieceName: operation.pieceName,
            pieceVersion: operation.pieceVersion, actionName: operation.actionName,
            devPieces: EngineConstants.DEV_PIECES
        });
        const depthToPropertyMap = tsort.sortPropertiesByDependencies(pieceAction.props)
        const resolvedInput = await resolveProperties(depthToPropertyMap, operation.instruction, pieceAction, operation.model)

        const step: PieceAction = {
            name: operation.actionName,
            displayName: operation.actionName,
            type: FlowActionType.PIECE,
            settings: {
                input: resolvedInput,
                actionName: operation.actionName,
                pieceName: operation.pieceName,
                pieceVersion: operation.pieceVersion,
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
            constants: EngineConstants.fromExecuteActionInput(operation),
        })

        const { output: stepOutput, errorMessage, status } = output.steps[operation.actionName]

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

async function resolveProperties(depthToPropertyMap: Record<number, string[]>, instruction: string, action: Action, model: LanguageModel): Promise<Record<string, unknown>> {
    let result: Record<string, unknown> = {}
    for (const [_, properties] of Object.entries(depthToPropertyMap)) {
        const propertyToFill: Record<string, z.ZodTypeAny> = {}
        for (const property of properties) {
            const propertyFromAction = action.props[property]
            const propertyType = propertyFromAction.type
            const skip = [PropertyType.BASIC_AUTH, PropertyType.OAUTH2, PropertyType.CUSTOM_AUTH, PropertyType.CUSTOM, PropertyType.MARKDOWN]
            if (skip.includes(propertyType)) {
                continue
            }
            const propertySchema = propertyToSchema(action, property)
            propertyToFill[property] = propertyFromAction.required ? propertySchema : propertySchema.nullish()
        }
        const schemaObject = z.object(propertyToFill) as z.ZodTypeAny;
        const { object } = await generateObject({
            model: model,
            schema: schemaObject,
            prompt: constructExtractionPrompt(instruction, propertyToFill),
        });
        result = {
            ...result,
            ...(object as Record<string, unknown>),
        }
    }
    return result
}

const constructExtractionPrompt = (instruction: string, propertyToFill: Record<string, z.ZodTypeAny>): string => {
    const propertyNames = Object.keys(propertyToFill).join('", "');
    return `
You are an expert at understanding API schemas and filling out properties based on user instructions.

TASK: Fill out the properties "${propertyNames}" based on the user's instructions.

USER INSTRUCTIONS:
${instruction}

IMPORTANT:
- For dropdown, multi-select dropdown, and static dropdown properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- For array properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- For dynamic properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- THE OPTIONS ARRAY WILL BE [{ label: string, value: string | object }]. YOU MUST SELECT THE value FIELD FROM THE OPTION OBJECT.
- For DATE_TIME properties, return date strings in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Use actual values from the user instructions to determine the correct value for each property, either as a hint for selecting options from dropdowns or to fill in the property if possible.
- Must include all required properties, even if the user does not provide a value. If a required field is missing, look up the correct value or provide a reasonable default—otherwise, the task may fail.
- IMPORTANT: If a property is not required and you do not have any information to fill it, you MUST skip it.
`;
}

type ExecuteToolOperationWithModel = ExecuteToolOperation & {
    model: LanguageModel
}


function propertyToSchema(action: ActionBase, propertyName: string): z.ZodTypeAny {
    const property = action.props[propertyName];
    assertNotNullOrUndefined(property, `Property ${propertyName} not found in action ${action.name}`);
    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.MARKDOWN:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
        case PropertyType.COLOR:
            return z.string();
        case PropertyType.DROPDOWN:
        case PropertyType.STATIC_DROPDOWN:
            return z.string();
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
            return z.array(z.string());
        case PropertyType.NUMBER:
            return z.number();
        case PropertyType.ARRAY:
            return z.array(z.unknown());
        case PropertyType.OBJECT:
            return z.record(z.string(), z.unknown());
        case PropertyType.JSON:
            return z.record(z.string(), z.unknown());
        case PropertyType.DYNAMIC:
            return z.record(z.string(), z.unknown());
        case PropertyType.CHECKBOX:
            return z.boolean();
        case PropertyType.OAUTH2:
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.SECRET_TEXT:
            throw new Error(`Unsupported property type: ${property.type}`);
        case PropertyType.CUSTOM:
            return z.string();
    }
}