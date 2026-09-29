import { ActivepiecesAiBilling, AIProviderName, isNil, spreadIfDefined } from '@activepieces/core-utils'
import { activepiecesAiCost, aiUtils, FlowStepMetadata } from '@activepieces/server-utils'
import { AI_PROVIDER_CAPABILITIES, AiProviderCredentials, GenerateImageJobData, getEffectiveProviderAndModel, ResolveAiProviderResponse } from '@activepieces/shared'
import { generateImage, generateText, ImageModel, ImagePart, LanguageModel } from 'ai'
import { JobContext } from '../../types'
import { ResolvedAiFile } from './ai-files'

export async function generateImageStep({ ctx, data, resolved, flowStep, billing, inputImages }: {
    ctx: JobContext
    data: GenerateImageJobData
    resolved: ResolveAiProviderResponse
    flowStep: FlowStepMetadata
    billing: ActivepiecesAiBilling
    inputImages: ResolvedAiFile[]
}): Promise<string> {
    const image = await getGeneratedImage({ credentials: resolved, modelId: data.modelId, prompt: data.prompt ?? '', advancedOptions: data.advancedOptions, inputImages, flowStep, billing })
    const { url } = await ctx.apiClient.saveFlowStepFile({
        projectId: data.projectId,
        platformId: data.platformId,
        flowRunId: data.flowRunId,
        data: imageBytesOf(image),
        fileName: 'image.png',
    })
    return url
}

export async function getGeneratedImage({ credentials, modelId, prompt, advancedOptions, inputImages, flowStep, billing, turnAlreadyCharged = false, aspectRatio, abortSignal }: {
    credentials: AiProviderCredentials
    modelId: string
    prompt: string
    advancedOptions?: Record<string, unknown>
    inputImages: ResolvedAiFile[]
    flowStep?: FlowStepMetadata
    billing: ActivepiecesAiBilling
    turnAlreadyCharged?: boolean
    aspectRatio?: `${number}:${number}`
    abortSignal?: AbortSignal
}): Promise<GeneratedImage> {
    const model = createImageCapableModel({ credentials, modelId, flowStep, billing, turnAlreadyCharged })
    const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider: credentials.provider, model: modelId })
    const resolvedProvider = effectiveProvider ?? credentials.provider
    const hasInputImages = inputImages.length > 0

    return withImageInputErrorContext({ modelId, hasInputImages }, async () => {
        if (GENERATES_IMAGES_THROUGH_TEXT.has(resolvedProvider)) {
            if (model.kind !== 'language') {
                throw new Error(`Model "${modelId}" resolves to ${resolvedProvider}, which generates images through text, but the provider returned an image-only model`)
            }
            return generateImageUsingGenerateText({ model: model.model, prompt, inputImages, aspectRatio, abortSignal })
        }
        if (model.kind !== 'image') {
            throw new Error(`Provider ${resolvedProvider} does not support image models`)
        }
        const { image } = await generateImage({
            model: model.model,
            abortSignal,
            ...spreadIfDefined('aspectRatio', aspectRatio),
            prompt: hasInputImages
                ? { text: prompt, images: inputImages.map((file) => Buffer.from(file.base64, 'base64')) }
                : prompt,
            providerOptions: { [resolvedProvider]: { ...stripLegacyImageField(advancedOptions) } } as Parameters<typeof generateImage>[0]['providerOptions'],
        })
        if (!turnAlreadyCharged) {
            activepiecesAiCost.reportFixedCredits({ billing, provider: credentials.provider, modelId })
        }
        return image
    })
}

export function imageBytesOf(image: GeneratedImage): Buffer {
    return !isNil(image.base64) && image.base64.length > 0 ? Buffer.from(image.base64, 'base64') : Buffer.from(image.uint8Array)
}

function createImageCapableModel({ credentials, modelId, flowStep, billing, turnAlreadyCharged }: {
    credentials: AiProviderCredentials
    modelId: string
    flowStep?: FlowStepMetadata
    billing: ActivepiecesAiBilling
    turnAlreadyCharged: boolean
}): ImageCapableModel {
    if (!AI_PROVIDER_CAPABILITIES[credentials.provider].supportsImageGeneration) {
        throw new Error(`Provider ${credentials.provider} does not support image models`)
    }
    const imageModel = aiUtils.createModelForImages({ credentials, modelId, flowStep })
    if (!isNil(imageModel)) {
        return { kind: 'image', model: imageModel }
    }
    return { kind: 'language', model: aiUtils.createModel({ credentials, modelId, flowStep, billing, turnAlreadyCharged, imageGeneration: true }) }
}

async function generateImageUsingGenerateText({ model, prompt, inputImages, aspectRatio, abortSignal }: {
    model: LanguageModel
    prompt: string
    inputImages: ResolvedAiFile[]
    aspectRatio?: string
    abortSignal?: AbortSignal
}): Promise<GeneratedImage> {
    const imageParts = inputImages.map<ImagePart>((file) => ({
        type: 'image',
        image: `data:${file.mimeType};base64,${file.base64}`,
    }))
    const result = await generateText({
        model,
        abortSignal,
        providerOptions: {
            google: { responseModalities: ['TEXT', 'IMAGE'], ...spreadIfDefined('imageConfig', isNil(aspectRatio) ? undefined : { aspectRatio }) },
            openrouter: { modalities: ['image', 'text'], ...spreadIfDefined('image_config', isNil(aspectRatio) ? undefined : { aspect_ratio: aspectRatio }) },
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
