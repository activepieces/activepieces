import { Action, DropdownOption, ExecutePropsResult, PieceProperty, PropertyType } from '@activepieces/pieces-framework'
import { AgentPieceTool, ExecuteToolOperation, ExecuteToolResponse, ExecutionToolStatus, FieldControlMode, FlowActionType, isNil, PieceAction, PropertyExecutionType, StepOutputStatus } from '@activepieces/shared'
import { generateObject, LanguageModel, Tool } from 'ai'
import { z } from 'zod/v4'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { pieceHelper } from '../helper/piece-helper'
import { pieceLoader } from '../helper/piece-loader'
import { tsort } from './tsort'

export const agentTools = {
    async tools({ engineConstants, tools, model }: ConstructToolParams): Promise<Record<string, Tool>> {
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
    const auth = operation.predefinedInput?.auth
    const predefinedInputsFields = operation.predefinedInput?.fields || {}

    let result: Record<string, unknown> = {}

    if (auth) {
        result.auth = auth
    }

    for (const [propertyName, field] of Object.entries(predefinedInputsFields)) {
        if (field.mode === FieldControlMode.CHOOSE_YOURSELF) {
            result[propertyName] = field.value
        }
        else if (field.mode === FieldControlMode.LEAVE_EMPTY) {
            result[propertyName] = undefined
        }
    }

    for (const [_, properties] of Object.entries(depthToPropertyMap)) {
        const propertyToFill: Record<string, z.ZodTypeAny> = {}
        const propertyDetails: PropertyDetail[] = []

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
            if (skipTypes.includes(propertyType) || property in result) {
                continue
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

            const propertyDetail = await buildPropertyDetail(
                property,
                propertyFromAction,
                operation,
                result,
            )
            if (!isNil(propertyDetail)) {
                propertyDetails.push(propertyDetail)
            }
        }

        if (Object.keys(propertyToFill).length === 0) continue

        const schemaObject = z.object(propertyToFill) as z.ZodTypeAny
        const extractionPrompt = constructExtractionPrompt(
            instruction,
            propertyToFill,
            propertyDetails,
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
    propertyDetails: PropertyDetail[],
    existingValues: Record<string, unknown>,
): string => {
    const propertyNames = Object.keys(propertyToFill).join('", "')

    const existingValuesContext = Object.keys(existingValues).length > 0
        ? buildExistingValuesSection(existingValues)
        : ''

    const propertyDetailsSection = propertyDetails.length > 0
        ? buildPropertyDetailsSection(propertyDetails)
        : ''

    return `
You are an expert at understanding API schemas and filling out properties based on user instructions.

**TASK**:
- Fill out the properties "${propertyNames}" based on the user's instructions.
- Output must be a valid JSON object matching the schema.

**USER INSTRUCTIONS**:
${instruction}

${existingValuesContext}

${propertyDetailsSection}

**RULES** (MUST FOLLOW):
- For dropdown, multi-select dropdown, and static dropdown properties: Select values ONLY from the provided options array. Use the 'value' field from the option objects.
- For array properties: Select values ONLY from the provided options array if specified.
- For dynamic properties: Select values ONLY from the provided options array if specified.
- Options format: [{ label: string, value: string | object | number | boolean }]
- For DATE_TIME properties: Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Use actual values from the user instructions to determine property values.
- Use already filled values as context for consistency.
- Required properties: MUST include all, even if missing from instructions. Infer reasonable defaults or look for hints if possible.
- Optional properties: Skip if no information is available—do not invent values.
- Do not add extra properties outside the requested ones.
- Ensure output is parseable JSON without additional text.
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

type PropertyDetail = {
    name: string
    type: PropertyType
    description?: string
    options?: DropdownOption<unknown>[]
}

async function buildPropertyDetail(propertyName: string, property: PieceProperty, operation: ExecuteToolOperation, input: Record<string, unknown>): Promise<PropertyDetail | null> {
    const baseDetail: PropertyDetail = {
        name: propertyName,
        type: property.type,
        description: property.description,
    }

    if (
        property.type === PropertyType.DROPDOWN ||
        property.type === PropertyType.MULTI_SELECT_DROPDOWN ||
        property.type === PropertyType.STATIC_DROPDOWN ||
        property.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN
    ) {
        const options = await loadOptions(propertyName, operation, input)
        return {
            ...baseDetail,
            options,
        }
    }

    return baseDetail
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

function buildExistingValuesSection(existingValues: Record<string, unknown>): string {
    return `
**ALREADY FILLED VALUES** (use for context and consistency):
${JSON.stringify(existingValues, null, 2)}
`
}

function buildPropertyDetailsSection(propertyDetails: PropertyDetail[]): string {
    const sections = propertyDetails.map(detail => {
        let content = `- Name: ${detail.name}\n  Type: ${detail.type}`
        if (detail.description) {
            content += `\n  Description: ${detail.description}`
        }
        if (detail.options && detail.options.length > 0) {
            content += `\n  Options: ${JSON.stringify(detail.options, null, 2)}`
        }
        return content
    }).join('\n\n')

    return `
**PROPERTY DETAILS**:
${sections}
`
}

type ConstructToolParams = {
    engineConstants: EngineConstants
    tools: AgentPieceTool[]
    model: LanguageModel
}