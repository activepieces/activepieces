import { Action, DropdownOption, ExecutePropsResult, PieceProperty, PropertyType } from '@activepieces/pieces-framework'
import { AgentPieceTool, ExecuteToolOperation, ExecuteToolResponse, ExecutionToolStatus, FieldControlMode, FlowActionType, isNil, PieceAction, PropertyExecutionType, StepOutputStatus } from '@activepieces/shared'
import { generateObject, LanguageModel, ToolSet } from 'ai'
import { z } from 'zod/v4'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { pieceHelper } from '../helper/piece-helper'
import { pieceLoader } from '../helper/piece-loader'
import { tsort } from './tsort'

export const agentTools = {
    async tools({ engineConstants, tools, model }: ConstructToolParams): Promise<ToolSet> {
        const piecesTools = await Promise.all(tools.map(async (tool) => {

            const { pieceAction } = await pieceLoader.getPieceAndActionOrThrow({
                pieceName: tool.pieceMetadata.pieceName,
                pieceVersion: tool.pieceMetadata.pieceVersion,
                actionName: tool.pieceMetadata.actionName,
                devPieces: EngineConstants.DEV_PIECES,
            })
            return {
                name: tool.toolName,
                description: pieceAction.description,
                inputSchema: z.object({
                    instruction: z.string().describe('The instruction to the tool'),
                }),
                execute: async ({ instruction }: { instruction: string }) =>
                    execute({
                        ...engineConstants,
                        instruction,
                        pieceName: tool.pieceMetadata.pieceName,
                        pieceVersion: tool.pieceMetadata.pieceVersion,
                        actionName: tool.pieceMetadata.actionName,
                        predefinedInput: tool.pieceMetadata.predefinedInput,
                        model,
                    }),
            }
        }))
  
        return {
            ...Object.fromEntries(piecesTools.map((tool) => [tool.name, tool])),
        }
    },
}

async function resolveProperties(
    depthToPropertyMap: Record<number, string[]>, 
    instruction: string, 
    action: Action, 
    model: LanguageModel, 
    operation: ExecuteToolOperation,
): Promise<Record<string, unknown>> {
    const auth = operation.predefinedInput.auth
    const predefinedInputsFields = operation.predefinedInput.fields || {}
    
    let result: Record<string, unknown> = {}
    
    if (auth) {
        result.auth = auth
    }
    
    for (const [propertyName, field] of Object.entries(predefinedInputsFields)) {
        if (field.mode === FieldControlMode.CHOOSE_YOURSELF && field.value !== undefined) {
            result[propertyName] = field.value
        }
        else if (field.mode === FieldControlMode.LEAVE_EMPTY) {
            result[propertyName] = undefined
        }
    }
    
    for (const [_, properties] of Object.entries(depthToPropertyMap)) {
        const propertyToFill: Record<string, z.ZodTypeAny> = {}
        const propertyPrompts: string[] = []
        
        for (const property of properties) {
            const propertyFromAction = action.props[property]
            const propertyType = propertyFromAction.type
            const skipTypes = [
                PropertyType.BASIC_AUTH, 
                PropertyType.OAUTH2, 
                PropertyType.CUSTOM_AUTH, 
                PropertyType.CUSTOM, 
                PropertyType.MARKDOWN,
            ]
            
            if (skipTypes.includes(propertyType)) {
                continue
            }
            
            const fieldControl = predefinedInputsFields[property]
            const fieldMode = fieldControl?.mode || FieldControlMode.AGENT_DECIDE
            
            if (fieldMode === FieldControlMode.CHOOSE_YOURSELF || 
                fieldMode === FieldControlMode.LEAVE_EMPTY) {
                continue
            }
            
            if (fieldMode === FieldControlMode.AGENT_DECIDE) {
                const propertyPrompt = await buildPromptForProperty(
                    property, 
                    propertyFromAction, 
                    operation, 
                    result,
                )
                if (!isNil(propertyPrompt)) {
                    propertyPrompts.push(propertyPrompt)
                }
                
                const propertySchema = await propertyToSchema(
                    property, 
                    propertyFromAction, 
                    operation, 
                    result,
                )
                propertyToFill[property] = propertyFromAction.required 
                    ? propertySchema 
                    : propertySchema.nullish()
            }
        }
        
        if (Object.keys(propertyToFill).length === 0) continue
        
        const schemaObject = z.object(propertyToFill) as z.ZodTypeAny
        const extractionPrompt = constructExtractionPrompt(
            instruction, 
            propertyToFill, 
            propertyPrompts,
            result,
        )
        const { object } = await generateObject({
            model,
            schema: schemaObject,
            prompt: extractionPrompt,
            mode: 'json',
            output: 'object',
        })
        result = {
            ...result,
            ...(object as Record<string, unknown>),
        }
    }
    return result
}

async function execute(operation: ExecuteToolOperationWithModel): Promise<ExecuteToolResponse> {
    
    const { pieceAction } = await pieceLoader.getPieceAndActionOrThrow({
        pieceName: operation.pieceName,
        pieceVersion: operation.pieceVersion,
        actionName: operation.actionName,
        devPieces: EngineConstants.DEV_PIECES,
    })

    const depthToPropertyMap = tsort.sortPropertiesByDependencies(pieceAction.props)
    const resolvedInput = await resolveProperties(depthToPropertyMap, operation.instruction, pieceAction, operation.model, operation)

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
        status: status === StepOutputStatus.FAILED ? ExecutionToolStatus.FAILED : ExecutionToolStatus.SUCCESS,
        output: stepOutput,
        resolvedInput: {
            ...resolvedInput,
            auth: 'Redacted',
        },
        errorMessage,
    }
}

const constructExtractionPrompt = (
    instruction: string, 
    propertyToFill: Record<string, z.ZodTypeAny>, 
    propertyPrompts: string[],
    existingValues: Record<string, unknown>,
): string => {
    const propertyNames = Object.keys(propertyToFill).join('", "')
    
    const existingValuesContext = Object.keys(existingValues).length > 0
        ? `\nALREADY FILLED VALUES (for context):\n${JSON.stringify(existingValues, null, 2)}\n`
        : ''
    
    return `
You are an expert at understanding API schemas and filling out properties based on user instructions.

TASK: Fill out the properties "${propertyNames}" based on the user's instructions.
${existingValuesContext}
USER INSTRUCTIONS:
${instruction}

${propertyPrompts.join('\n')}

IMPORTANT:
- For dropdown, multi-select dropdown, and static dropdown properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- For array properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- For dynamic properties, YOU MUST SELECT VALUES FROM THE PROVIDED OPTIONS ARRAY ONLY.
- THE OPTIONS ARRAY WILL BE [{ label: string, value: string | object }]. YOU MUST SELECT THE value FIELD FROM THE OPTION OBJECT.
- For DATE_TIME properties, return date strings in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Use actual values from the user instructions to determine the correct value for each property, either as a hint for selecting options from dropdowns or to fill in the property if possible.
- Use the ALREADY FILLED VALUES as context to understand the task better and make consistent choices.
- Must include all required properties, even if the user does not provide a value. If a required field is missing, look up the correct value or provide a reasonable default—otherwise, the task may fail.
- IMPORTANT: If a property is not required and you do not have any information to fill it, you MUST skip it.
`
}

type ExecuteToolOperationWithModel = ExecuteToolOperation & {
    model: LanguageModel
}


async function propertyToSchema(propertyName: string, property: PieceProperty, operation: ExecuteToolOperation, resolvedInput: Record<string, unknown>): Promise<z.ZodTypeAny> {
    let schema: z.ZodTypeAny
    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.MARKDOWN:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
        case PropertyType.COLOR:
            schema = z.string()
            break
        case PropertyType.DROPDOWN:
        case PropertyType.STATIC_DROPDOWN: {
            schema = z.union([z.string(), z.number(), z.record(z.string(), z.unknown())])
            break
        }
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN: {
            schema = z.union([z.array(z.string()), z.array(z.record(z.string(), z.unknown()))])
            break
        }
        case PropertyType.NUMBER:
            schema = z.number()
            break
        case PropertyType.ARRAY:
            return z.array(z.unknown())
        case PropertyType.OBJECT:
            schema = z.record(z.string(), z.unknown())
            break
        case PropertyType.JSON:
            schema = z.record(z.string(), z.unknown())
            break
        case PropertyType.DYNAMIC: {
            schema = await buildDynamicSchema(propertyName, operation, resolvedInput)
            break
        }
        case PropertyType.CHECKBOX:
            schema = z.boolean()
            break
        case PropertyType.CUSTOM:
            schema = z.string()
            break
        case PropertyType.OAUTH2:
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.SECRET_TEXT:
            throw new Error(`Unsupported property type: ${property.type}`)
    }
    if (property.defaultValue) {
        schema = schema.default(property.defaultValue)
    }
    if (property.description) {
        schema = schema.describe(property.description)
    }
    return property.required ? schema : schema.nullish()
}

async function buildDynamicSchema(propertyName: string, operation: ExecuteToolOperation, resolvedInput: Record<string, unknown>): Promise<z.ZodTypeAny> {
    const response = await pieceHelper.executeProps({
        ...operation,
        propertyName,
        actionOrTriggerName: operation.actionName,
        input: resolvedInput,
        sampleData: {},
        searchValue: undefined,
    }) as unknown as ExecutePropsResult<PropertyType.DYNAMIC>
    const dynamicProperties = response.options
    const dynamicSchema: Record<string, z.ZodTypeAny> = {}
    for (const [key, value] of Object.entries(dynamicProperties)) {
        dynamicSchema[key] = await propertyToSchema(key, value, operation, resolvedInput)
    }
    return z.object(dynamicSchema)
}


async function buildPromptForProperty(propertyName: string, property: PieceProperty, operation: ExecuteToolOperation, input: Record<string, unknown>): Promise<string | null> {
    if (property.type === PropertyType.DROPDOWN || property.type === PropertyType.MULTI_SELECT_DROPDOWN) {
        const options = await loadOptions(propertyName, operation, input)
        return `The options for the property "${propertyName}" are: ${JSON.stringify(options)}`
    }
    return null
}

async function loadOptions(propertyName: string, operation: ExecuteToolOperation, input: Record<string, unknown>): Promise<DropdownOption<unknown>[]> {
    const response = await pieceHelper.executeProps({
        ...operation,
        propertyName,
        actionOrTriggerName: operation.actionName,
        input,
        sampleData: {},
        searchValue: undefined,
    }) as unknown as ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN>
    const options = response.options
    return options.options
}

type ConstructToolParams = {
    engineConstants: EngineConstants
    tools: AgentPieceTool[]
    model: LanguageModel
}