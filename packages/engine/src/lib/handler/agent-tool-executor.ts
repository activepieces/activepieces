import { Action, DropdownOption, ExecutePropsResult, PieceProperty, PropertyType } from '@activepieces/pieces-framework'
import { AgentPieceTool, ExecuteToolOperation, ExecuteToolResponse, ExecutionToolStatus, FieldControlMode, FlowActionType, isNil, PieceAction, PropertyExecutionType, StepOutputStatus } from '@activepieces/shared'
import { generateText, LanguageModel, Output, jsonSchema } from 'ai'
import { EngineConstants } from './context/engine-constants'
import { FlowExecutorContext } from './context/flow-execution-context'
import { flowExecutor } from './flow-executor'
import { pieceHelper } from '../helper/piece-helper'
import { pieceLoader } from '../helper/piece-loader'
import { tsort } from '../tools/tsort'

export const agentToolExecutor = {
    async execute(operation: ExecuteToolOperationWithModel): Promise<ExecuteToolResponse> {
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
        const propertyToFill: Record<string, unknown> = {}
        const propertyDetails: PropertyDetail[] = []
        const requiredProperties: string[] = []

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
            propertyToFill[property] = propertySchema

            if (propertyFromAction.required) {
                requiredProperties.push(property)
            }

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

        const extractionPrompt = constructExtractionPrompt(
            instruction,
            propertyToFill,
            propertyDetails,
            result,
        )

        const schemaToUse = jsonSchema({
            type: 'object',
            properties: propertyToFill as Record<string, any>,
            required: requiredProperties,
        })

        console.error('schemaToUse', schemaToUse);
        const { output } = await generateText({
            model,
            prompt: extractionPrompt,
            output: Output.object({
                schema: schemaToUse,
            }),
        })
        console.error('output', output);


        result = {
            ...result,
            ...(output as Record<string, unknown>),
        }

    }
    return result
}

const constructExtractionPrompt = (
    instruction: string,
    propertyToFill: Record<string, unknown>,
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

async function propertyToSchema(propertyName: string, property: PieceProperty, operation: ExecuteToolOperation, resolvedInput: Record<string, unknown>): Promise<Record<string, unknown>> {
    let schema: Record<string, unknown>

    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.MARKDOWN:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
        case PropertyType.COLOR:
            schema = { type: 'string' }
            break
        case PropertyType.DROPDOWN:
        case PropertyType.STATIC_DROPDOWN: {
            schema = {
                anyOf: [
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'object', additionalProperties: false },
                ],
            }
            break
        }
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN: {
            schema = {
                anyOf: [
                    { type: 'array', items: { type: 'string' } },
                    { type: 'array', items: { type: 'object', additionalProperties: false } },
                ],
            }
            break
        }
        case PropertyType.NUMBER:
            schema = { type: 'number' }
            break
        case PropertyType.ARRAY:
            schema = { type: 'array', items: { type: 'string' } }
            if (property.defaultValue !== undefined) {
                schema.default = property.defaultValue
            }
            if (property.description) {
                schema.description = property.description
            }
            return schema
        case PropertyType.OBJECT:
            schema = { type: 'object', additionalProperties: false }
            break
        case PropertyType.JSON:
            schema = { type: 'object', additionalProperties: false }
            break
        case PropertyType.DYNAMIC: {
            schema = await buildDynamicSchema(propertyName, operation, resolvedInput) as Record<string, unknown>
            break
        }
        case PropertyType.CHECKBOX:
            schema = { type: 'boolean' }
            break
        case PropertyType.CUSTOM:
            schema = { type: 'string' }
            break
        case PropertyType.OAUTH2:
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.SECRET_TEXT:
            throw new Error(`Unsupported property type: ${property.type}`)
    }
    if (property.defaultValue !== undefined) {
        schema.default = property.defaultValue
    }
    if (property.description) {
        schema.description = property.description
    }
    return schema
}

async function buildDynamicSchema(propertyName: string, operation: ExecuteToolOperation, resolvedInput: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await pieceHelper.executeProps({
        ...operation,
        propertyName,
        actionOrTriggerName: operation.actionName,
        input: resolvedInput,
        sampleData: {},
        searchValue: undefined,
    }) as unknown as ExecutePropsResult<PropertyType.DYNAMIC>
    const dynamicProperties = response.options
    const dynamicSchema: Record<string, unknown> = {}
    const requiredProperties: string[] = []
    for (const [key, value] of Object.entries(dynamicProperties)) {
        const propertySchema = await propertyToSchema(key, value, operation, resolvedInput) as Record<string, unknown>
        dynamicSchema[key] = propertySchema
        if (value.required) {
            requiredProperties.push(key)
        }
    }
    return {
        type: 'object',
        properties: dynamicSchema,
        required: requiredProperties,
    }
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

    switch (property.type) {
        case PropertyType.STATIC_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN: {
            const options = property.options.options
            return {
                ...baseDetail,
                options,
            }
        }
        case PropertyType.DROPDOWN:
        case PropertyType.MULTI_SELECT_DROPDOWN:
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