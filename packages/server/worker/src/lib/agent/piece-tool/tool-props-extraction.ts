import { ExecuteToolOperation, FieldControlMode, isNil } from "@activepieces/shared"
import { generateObject, LanguageModel } from "ai"
import { ActionBase, DropdownOption, ExecutePropsResult, PieceProperty, PropertyType } from "@activepieces/pieces-framework"
import z from "zod"
import { operationHandler } from "../../compute/operation-handler"

export const toolPropsExtraction = {
    async resolveProperties(
        depthToPropertyMap: Record<number, string[]>,
        instruction: string,
        action: ActionBase,
        model: LanguageModel,
        operation: ExecuteToolOperation,
    ): Promise<Record<string, unknown>> {
        const auth = operation.predefinedInput?.auth
        const predefinedInputsFields = operation.predefinedInput?.fields || {}

        let result: Record<string, unknown> = {}

        if (auth) {
            result['auth'] = auth
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
    },
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
            const response = null as unknown as ExecutePropsResult<PropertyType.DYNAMIC>
            const dynamicProperties = response.options
            const dynamicSchema: Record<string, z.ZodTypeAny> = {}
            for (const [key, value] of Object.entries(dynamicProperties)) {
                dynamicSchema[key] = await propertyToSchema(key, value, operation, resolvedInput)
            }
            schema = z.object(dynamicSchema)
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

function constructExtractionPrompt(
    instruction: string,
    propertyToFill: Record<string, z.ZodTypeAny>,
    propertyDetails: PropertyDetail[],
    existingValues: Record<string, unknown>,
): string {
    const propertyNames = Object.keys(propertyToFill).join('", "')

    const existingValuesContext = Object.keys(existingValues).length > 0
        ? `**ALREADY FILLED VALUES** (use for context and consistency):${JSON.stringify(existingValues, null, 2)} `
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


type PropertyDetail = {
    name: string
    type: PropertyType
    description?: string
    options?: DropdownOption<unknown>[]
}
