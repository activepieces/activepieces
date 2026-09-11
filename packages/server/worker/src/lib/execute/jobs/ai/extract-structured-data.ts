import { isNil, spreadIfDefined } from '@activepieces/core-utils'
import { aiUtils, FlowStepMetadata } from '@activepieces/server-utils'
import { AiStepFile, ExecuteAiJobData, ResolveAiProviderResponse } from '@activepieces/shared'
import { generateText, jsonSchema, ModelMessage, tool, UserModelMessage } from 'ai'

export async function extractStructuredData({ data, resolved, flowStep }: {
    data: ExecuteAiJobData
    resolved: ResolveAiProviderResponse
    flowStep: FlowStepMetadata
}): Promise<unknown> {
    const files = data.files ?? []
    if (isNil(data.text) && files.length === 0) {
        throw new Error('Please provide text or image/PDF to extract data from.')
    }
    const model = aiUtils.createModel({
        provider: resolved.provider,
        auth: resolved.auth,
        config: resolved.config,
        modelId: data.modelId,
        flowStep,
    })
    const { schemaDefinition, sanitizedNameMap } = buildSchema(data)
    const extractionTool = tool({
        description: 'Extract structured data from the provided content',
        inputSchema: schemaDefinition,
        execute: async (extracted) => extracted,
    })

    try {
        const result = await generateText({
            model,
            ...spreadIfDefined('maxOutputTokens', data.maxOutputTokens),
            tools: { extractData: extractionTool },
            toolChoice: 'required',
            messages: buildMessages({ data, files }),
        })
        const toolCalls = result.toolCalls
        if (isNil(toolCalls) || toolCalls.length === 0) {
            throw new Error('No structured data could be extracted from the input.')
        }
        return restoreFieldNames({ extracted: toolCalls[0].input, sanitizedNameMap })
    }
    catch (error) {
        throw new Error(`Failed to extract structured data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

function buildSchema(data: ExecuteAiJobData): { schemaDefinition: ReturnType<typeof jsonSchema>, sanitizedNameMap: Record<string, string> } {
    const fields = data.schema?.fields
    if (data.schema?.mode === 'advanced') {
        return { schemaDefinition: jsonSchema(fields as Parameters<typeof jsonSchema>[0]), sanitizedNameMap: {} }
    }
    const simpleFields = (fields ?? []) as SimpleField[]
    const sanitizedNameMap: Record<string, string> = {}
    const properties: Record<string, { type: string, description?: string }> = {}
    const required: string[] = []
    for (const field of simpleFields) {
        const sanitizedFieldName = field.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
        sanitizedNameMap[sanitizedFieldName] = field.name
        properties[sanitizedFieldName] = { type: field.type, description: field.description }
        if (field.isRequired) {
            required.push(sanitizedFieldName)
        }
    }
    return { schemaDefinition: jsonSchema({ type: 'object', properties, required } as Parameters<typeof jsonSchema>[0]), sanitizedNameMap }
}

function buildMessages({ data, files }: { data: ExecuteAiJobData, files: AiStepFile[] }): ModelMessage[] {
    let textContent = data.prompt ?? 'Extract the following data from the provided data.'
    if (data.text) {
        textContent += `\n\nText to analyze:\n${data.text}`
    }
    const contentParts: UserModelMessage['content'] = [{ type: 'text', text: textContent }]
    for (const file of files) {
        if (file.base64.length === 0) {
            continue
        }
        if (file.mimeType.startsWith('image')) {
            contentParts.push({ type: 'image', image: `data:${file.mimeType};base64,${file.base64}` })
        }
        else if (file.mimeType.startsWith('application/pdf')) {
            contentParts.push({
                type: 'file',
                data: `data:${file.mimeType};base64,${file.base64}`,
                mediaType: file.mimeType,
                ...spreadIfDefined('filename', file.filename),
            })
        }
    }
    return [{ role: 'user', content: contentParts }]
}

function restoreFieldNames({ extracted, sanitizedNameMap }: { extracted: unknown, sanitizedNameMap: Record<string, string> }): unknown {
    if (Object.keys(sanitizedNameMap).length === 0 || typeof extracted !== 'object' || extracted === null) {
        return extracted
    }
    return Object.entries(extracted).reduce<Record<string, unknown>>((restored, [key, value]) => {
        restored[sanitizedNameMap[key] ?? key] = value
        return restored
    }, {})
}

type SimpleField = {
    name: string
    description?: string
    type: string
    isRequired: boolean
}
