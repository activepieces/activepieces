import { PieceProperty, PropertyType } from '@activepieces/pieces-framework'
import { McpProperty, McpPropertyType } from '@activepieces/shared'
import { z } from 'zod' 

function mcpPropertyToZod(property: McpProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case McpPropertyType.TEXT:
        case McpPropertyType.DATE:
            schema = z.string()
            break
        case McpPropertyType.NUMBER:
            schema = z.number()
            break
        case McpPropertyType.BOOLEAN:
            schema = z.boolean()
            break
        case McpPropertyType.ARRAY:
            schema = z.array(z.string())
            break
        case McpPropertyType.OBJECT:
            schema = z.record(z.string(), z.string())
            break
        default:
            schema = z.unknown()
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.nullish()
}

function piecePropertyToZod(property: PieceProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
            schema = z.string()
            break
        case PropertyType.NUMBER:
            schema = z.number()
            break
        case PropertyType.CHECKBOX:
            schema = z.boolean()
            break
        case PropertyType.ARRAY:
            schema = z.array(z.unknown())
            break
        case PropertyType.OBJECT:
        case PropertyType.JSON:
            schema = z.record(z.string(), z.unknown())
            break
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
            schema = z.union([z.array(z.string()), z.array(z.record(z.string(), z.unknown()))])
            break
        case PropertyType.DROPDOWN:
        case PropertyType.STATIC_DROPDOWN:
            schema = z.union([z.string(), z.number(), z.record(z.string(), z.unknown())])
            break
        case PropertyType.COLOR:
        case PropertyType.SECRET_TEXT:
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.OAUTH2:
            schema = z.string()
            break
        case PropertyType.MARKDOWN:
            schema = z.unknown().nullish()
            break
        case PropertyType.CUSTOM:
        case PropertyType.DYNAMIC:
            schema = z.unknown()
            break
    }

    if (property.defaultValue) {
        schema = schema.default(property.defaultValue)
    }

    if (property.description) {
        schema = schema.describe(property.description)
    }

    return property.required ? schema : schema.nullish()
}

export const mcpUtils = {
    mcpPropertyToZod,
    piecePropertyToZod,
}