import { AIProviderName, isNil } from '@activepieces/core-utils'
import { aiUtils, FlowStepMetadata } from '@activepieces/server-utils'
import { AI_PROVIDER_CAPABILITIES, AiStepFile, ExecuteAiJobData, getEffectiveProviderAndModel, ResolveAiProviderResponse } from '@activepieces/shared'
import { generateImage, generateText, ImageModel, ImagePart, LanguageModel } from 'ai'
import { JobContext } from '../../types'

export async function generateImageStep({ ctx, data, resolved, flowStep }: {
    ctx: JobContext
    data: ExecuteAiJobData
    resolved: ResolveAiProviderResponse
    flowStep: FlowStepMetadata
}): Promise<string> {
    const inputImages = data.files ?? []
    const image = await getGeneratedImage({ data, resolved, inputImages, flowStep })
    const imageData = !isNil(image.base64) && image.base64.length > 0
        ? Buffer.from(image.base64, 'base64')
        : Buffer.from(image.uint8Array)
    const { url } = await ctx.apiClient.saveFlowStepFile({
        projectId: data.projectId,
        platformId: data.platformId,
        flowRunId: data.flowRunId,
        data: imageData,
        fileName: 'image.png',
    })
    return url
}

async function getGeneratedImage({ data, resolved, inputImages, flowStep }: {
    data: ExecuteAiJobData
    resolved: ResolveAiProviderResponse
    inputImages: AiStepFile[]
    flowStep: FlowStepMetadata
}): Promise<GeneratedImage> {
    const model = createImageCapableModel({ resolved, modelId: data.modelId, flowStep })
    const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider: resolved.provider, model: data.modelId })
    const resolvedProvider = effectiveProvider ?? resolved.provider
    const prompt = data.prompt ?? ''
    const hasInputImages = inputImages.length > 0

    return withImageInputErrorContext({ modelId: data.modelId, hasInputImages }, async () => {
        if (GENERATES_IMAGES_THROUGH_TEXT.has(resolvedProvider)) {
            if (model.kind !== 'language') {
                throw new Error(`Model "${data.modelId}" resolves to ${resolvedProvider}, which generates images through text, but the provider returned an image-only model`)
            }
            return generateImageUsingGenerateText({ model: model.model, prompt, inputImages })
        }
        if (model.kind !== 'image') {
            throw new Error(`Provider ${resolvedProvider} does not support image models`)
        }
        const { image } = await generateImage({
            model: model.model,
            prompt: hasInputImages
                ? { text: prompt, images: inputImages.map((file) => Buffer.from(file.base64, 'base64')) }
                : prompt,
            providerOptions: { [resolvedProvider]: { ...stripLegacyImageField(data.advancedOptions) } } as Parameters<typeof generateImage>[0]['providerOptions'],
        })
        return image
    })
}

function createImageCapableModel({ resolved, modelId, flowStep }: {
    resolved: ResolveAiProviderResponse
    modelId: string
    flowStep: FlowStepMetadata
}): ImageCapableModel {
    if (!AI_PROVIDER_CAPABILITIES[resolved.provider].supportsImageGeneration) {
        throw new Error(`Provider ${resolved.provider} does not support image models`)
    }
    const { provider, auth, config } = resolved
    const imageModel = aiUtils.createModelForImages({ provider, auth, config, modelId })
    if (!isNil(imageModel)) {
        return { kind: 'image', model: imageModel }
    }
    return { kind: 'language', model: aiUtils.createModel({ provider, auth, config, modelId, flowStep }) }
}

async function generateImageUsingGenerateText({ model, prompt, inputImages }: {
    model: LanguageModel
    prompt: string
    inputImages: AiStepFile[]
}): Promise<GeneratedImage> {
    const imageParts = inputImages.map<ImagePart>((file) => ({
        type: 'image',
        image: `data:${file.mimeType};base64,${file.base64}`,
    }))
    const result = await generateText({
        model,
        providerOptions: {
            google: { responseModalities: ['TEXT', 'IMAGE'] },
            openrouter: { modalities: ['image', 'text'] },
        },
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, ...imageParts] }],
    })
    assertImageGenerationSuccess(result)
    return result.files[0]
}

async function withImageInputErrorContext<T>({ modelId, hasInputImages }: { modelId: string, hasInputImages: boolean }, run: () => Promise<T>): Promise<T> {
    try {
        return await run()
    }
    catch (error) {
        if (!hasInputImages) {
            throw error
        }
        const original = error instanceof Error ? error.message : String(error)
        throw new Error(
            `Image generation failed for model "${modelId}". ` +
            'This model may not support input images. Try a model that supports image editing — ' +
            'for example gpt-image-1, dall-e-2, or a Gemini Nano Banana model — or remove the input images. ' +
            `Original error: ${original}`,
        )
    }
}

function assertImageGenerationSuccess(result: Awaited<ReturnType<typeof generateText>>): void {
    const body = result.response.body
    const responseBody = typeof body === 'object' && body !== null && 'candidates' in body ? body : { candidates: [] }
    const responseCandidates = Array.isArray(responseBody.candidates) ? responseBody.candidates : []
    for (const candidate of responseCandidates) {
        if (candidate.finishReason !== 'STOP') {
            throw new Error('Image generation failed Reason:\n ' + JSON.stringify(responseCandidates, null, 2))
        }
    }
    if (isNil(result.files) || result.files.length === 0) {
        throw new Error('No image generated')
    }
}

function stripLegacyImageField(advancedOptions: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (isNil(advancedOptions)) {
        return advancedOptions
    }
    const { image: _legacy, ...rest } = advancedOptions
    return rest
}

const GENERATES_IMAGES_THROUGH_TEXT: ReadonlySet<AIProviderName | string> = new Set([
    AIProviderName.GOOGLE,
    AIProviderName.ACTIVEPIECES,
    AIProviderName.OPENROUTER,
    AIProviderName.CLOUDFLARE_GATEWAY,
])

type ImageCapableModel =
    | { kind: 'image', model: ImageModel }
    | { kind: 'language', model: LanguageModel }

type GeneratedImage = {
    base64?: string
    uint8Array: Uint8Array
    mediaType: string
}
