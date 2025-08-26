import { CreateType, Kind, SchemaOptions, Static, TLiteral, TObject, TSchema, TUnion, Type } from '@sinclair/typebox'



export type Cursor = string | null

export const Nullable = <T extends TSchema>(schema: T) => Type.Optional(Type.Unsafe<Static<T> | null>({
    ...schema, nullable: true,
}))

export type SeekPage<T> = {
    next: Cursor
    previous: Cursor
    data: T[]
}


export const SeekPage = (t: TSchema): TSchema => Type.Object({
    data: Type.Array(t),
    next: Nullable(Type.String({ description: 'Cursor to the next page' })),
    previous: Nullable(Type.String({ description: 'Cursor to the previous page' })),
})  

function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
}

export const spreadIfDefined = <T>(key: string, value: T | undefined | null): Record<string, T> => {
    if (isNil(value)) {
        return {}
    }
    return {
        [key]: value,
    }
}


// ------------------------------------------------------------------
// TDiscriminatedUnionObject
//
// Constructs a base TObject type requiring 1 discriminator property
// ------------------------------------------------------------------
// prettier-ignore
type TDiscriminatedUnionProperties<Discriminator extends string> = {
    [_ in Discriminator]: TLiteral
}
// prettier-ignore
type TDiscriminatedUnionObject<Discriminator extends string> = TObject<TDiscriminatedUnionProperties<Discriminator>>

// ------------------------------------------------------------------
// DiscriminatedUnion
// ------------------------------------------------------------------
export type TDiscriminatedUnion<Types extends TObject[] = TObject[]> = {
    [Kind]: 'DiscriminatedUnion'
    static: Static<TUnion<Types>>
    anyOf: Types
    discriminator: {
        propertyName: string
        mapping?: Record<string, string>
    }
} & TSchema

/** Creates a DiscriminatedUnion that works with OpenAPI. */
export function DiscriminatedUnion<Discriminator extends string, Types extends TDiscriminatedUnionObject<Discriminator>[]>(
    discriminator: Discriminator,
    types: [...Types],
    options?: SchemaOptions,
): TDiscriminatedUnion<Types> {
    return CreateType({
        [Kind]: 'DiscriminatedUnion',
        anyOf: types,
        discriminator: {
            propertyName: discriminator,
        },
    }, options) as never
}


const BaseModelSchema = {
    id: Type.String(),
    created: Type.String(),
    updated: Type.String(), 
}

export const AIProvider = Type.Object({
    ...BaseModelSchema,
    config: Type.Object({
        apiKey: Type.String(),
        azureOpenAI: Type.Optional(Type.Object({
            resourceName: Type.String(),
        })),
    }),
    provider: Type.String({ minLength: 1 }),
    platformId: Type.String(),
})

export type AIProvider = Static<typeof AIProvider>

export const AIProviderWithoutSensitiveData = Type.Omit(AIProvider, ['config'])
export type AIProviderWithoutSensitiveData = Static<typeof AIProviderWithoutSensitiveData>

export const CreateAIProviderRequest = Type.Object({
    provider: Type.String({ minLength: 1 }),
    apiKey: Type.String(),
    useAzureOpenAI: Type.Optional(Type.Boolean()),
    resourceName: Type.Optional(Type.String()),
})

export type CreateAIProviderRequest = Static<typeof CreateAIProviderRequest>

export const AI_USAGE_FEATURE_HEADER = 'ap-feature'
export const AI_USAGE_AGENT_ID_HEADER = 'ap-agent-id'
export const AI_USAGE_MCP_ID_HEADER = 'ap-mcp-id'

export enum AIUsageFeature {
    AGENTS = 'Agents',   
    MCP = 'MCP',
    TEXT_AI = 'Text AI',
    IMAGE_AI = 'Image AI',
    UTILITY_AI = 'Utility AI',
    UNKNOWN = 'Unknown',
}

const agentMetadata = Type.Object({
    feature: Type.Literal(AIUsageFeature.AGENTS),
    agentid: Type.String(),
})

const mcpMetadata = Type.Object({
    feature: Type.Literal(AIUsageFeature.MCP),
    mcpid: Type.String(),
})

const simpleFeatures = [AIUsageFeature.TEXT_AI, AIUsageFeature.IMAGE_AI, AIUsageFeature.UTILITY_AI, AIUsageFeature.UNKNOWN] as const
const simpleMetadataVariants = simpleFeatures.map(feature => 
    Type.Object({
        feature: Type.Literal(feature),
    }),
)

export const AIUsageMetadata = DiscriminatedUnion('feature', [
    agentMetadata,
    mcpMetadata,
    ...simpleMetadataVariants,
])

export type AIUsageMetadata = Static<typeof AIUsageMetadata>

export const AIUsage = Type.Object({
    ...BaseModelSchema,
    provider: Type.String({ minLength: 1 }),
    model: Type.String({ minLength: 1 }),
    cost: Type.Number({ minimum: 0 }),
    projectId: Type.String(),
    platformId: Type.String(),
    metadata: AIUsageMetadata,
})

export type AIUsage = Static<typeof AIUsage>

export const ListAICreditsUsageRequest = Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
    cursor: Type.Optional(Type.String()),
})

export type ListAICreditsUsageRequest = Static<typeof ListAICreditsUsageRequest>

export const ListAICreditsUsageResponse = SeekPage(
    Type.Intersect([
        Type.Omit(AIUsage, ['cost']),
        Type.Object({
            credits: Type.Number(),
            projectName: Type.String(),
        }),
    ]),
)

export type ListAICreditsUsageResponse = Static<typeof ListAICreditsUsageResponse>

export const AIErrorResponse = Type.Object({
    error: Type.Object({
        message: Type.String(),
        type: Type.String(),
        code: Type.String(),
    }),
})

export type AIErrorResponse = Static<typeof AIErrorResponse>

export * from './supported-ai-providers'
export * from './ai-sdk'
