import { ActivepiecesAiBilling, ActivepiecesAiCall, ActivepiecesAiConsumerSource, ActivepiecesAiCostReporter, AiCallTokens, AiCharge, AiChargeBasis, AIProviderName, isNil, spreadIfDefined } from '@activepieces/core-utils'
import { EmbeddingModelV4Result, isJSONObject, LanguageModelV4GenerateResult, LanguageModelV4StreamPart, LanguageModelV4StreamResult, LanguageModelV4Usage, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { EmbeddingModel, LanguageModel, wrapEmbeddingModel, wrapLanguageModel } from 'ai'
import { z } from 'zod'
import { lookupGeneration } from './openrouter-generation'

export function billedLanguageModel({ model, provider, providerConfigId, modelId, billing, charge }: BilledLanguageModelParams): LanguageModel {
    const context = billingContextOf({ provider, providerConfigId, modelId, billing, charge })
    if (isNil(context) || typeof model === 'string') {
        return model
    }
    return wrapLanguageModel({
        model,
        middleware: {
            wrapGenerate: ({ doGenerate }) => billGenerate({ doGenerate, context }),
            wrapStream: ({ doStream }) => billStream({ doStream, context }),
        },
    })
}

export function billedEmbeddingModel({ model, provider, providerConfigId, modelId, billing }: BilledEmbeddingModelParams): EmbeddingModel {
    if (isNil(billing) || typeof model === 'string' || model.specificationVersion !== 'v4') {
        return model
    }
    const basis = provider === AIProviderName.ACTIVEPIECES ? AiChargeBasis.PROVIDER_REPORTED_COST : AiChargeBasis.USAGE_ONLY
    const context: BillingContext = { basis, billing, provider, providerConfigId, modelId }
    return wrapEmbeddingModel({
        model,
        middleware: {
            wrapEmbed: ({ doEmbed }) => billEmbed({ doEmbed, context }),
        },
    })
}

export function reportFixedCredits({ billing, provider, providerConfigId, modelId, generationId }: ReportFixedCreditsParams): void {
    report({
        context: { basis: AiChargeBasis.FIXED_CREDITS, billing, provider, providerConfigId, modelId },
        call: createFixedCreditChargeInfo({ generationId }),
    })
}

export function reportProviderCost({ billing, provider, providerConfigId, modelId, costUsd, inputTokens, outputTokens, generationId }: ReportProviderCostParams): void {
    const context: BillingContext = { basis: AiChargeBasis.PROVIDER_REPORTED_COST, billing, provider, providerConfigId, modelId }
    if (isNil(costUsd)) {
        report({ context, generationId, call: undefined })
        return
    }
    report({
        context,
        generationId,
        call: { charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId, costUsd, inputTokens, outputTokens, observedCostUsd: costUsd },
    })
}

function billingContextOf({ provider, providerConfigId, modelId, billing, charge }: BillingContextParams): BillingContext | undefined {
    if (isNil(billing) || isNil(charge)) {
        return undefined
    }
    if (charge.basis !== AiChargeBasis.PROVIDER_REPORTED_COST) {
        return { basis: charge.basis, billing, provider, providerConfigId, modelId }
    }
    return { basis: AiChargeBasis.PROVIDER_REPORTED_COST, billing, provider, providerConfigId, modelId, apiKey: charge.managedApiKey }
}

async function billGenerate({ doGenerate, context }: BillGenerateParams): Promise<LanguageModelV4GenerateResult> {
    const result = await doGenerate()
    const generationId = result.response?.id
    report({ context, generationId, call: createBillingInfo({ context, generationId, providerMetadata: result.providerMetadata, usage: result.usage, headers: result.response?.headers }) })
    return result
}

async function billStream({ doStream, context }: BillStreamParams): Promise<LanguageModelV4StreamResult> {
    const { stream, ...rest } = await doStream()
    return { ...rest, stream: stream.pipeThrough(billedStream({ context, headers: rest.response?.headers })) }
}

async function billEmbed({ doEmbed, context }: BillEmbedParams): Promise<EmbeddingModelV4Result> {
    const result = await doEmbed()
    const generationId = parseOrUndefined(EmbeddingResponseBody, result.response?.body)?.id
    report({ context, generationId, call: createEmbeddingBillingInfo({ context, result, generationId }) })
    return result
}

function billedStream({ context, headers }: { context: BillingContext, headers: ResponseHeaders }): TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart> {
    const state: StreamState = { reported: false, headers }
    return new TransformStream({
        transform: (chunk, controller) => trackChunk({ chunk, controller, state, context }),
        flush: () => settleStream({ state, context }),
        cancel: () => settleStream({ state, context }),
    })
}

function trackChunk({ chunk, controller, state, context }: TrackChunkParams): void {
    if (chunk.type === 'response-metadata') {
        state.generationId = chunk.id ?? state.generationId
    }
    if (chunk.type === 'finish' && !state.reported) {
        const call = createBillingInfo({ context, generationId: state.generationId, providerMetadata: chunk.providerMetadata, usage: chunk.usage, headers: state.headers })
        if (!isNil(call)) {
            state.reported = true
            report({ context, generationId: state.generationId, call })
        }
    }
    controller.enqueue(chunk)
}

function settleStream({ state, context }: SettleStreamParams): void {
    if (state.reported) {
        return
    }
    state.reported = true
    if (context.basis === AiChargeBasis.FIXED_CREDITS) {
        report({ context, generationId: state.generationId, call: createFixedCreditChargeInfo({ generationId: state.generationId }) })
        return
    }
    if (context.basis === AiChargeBasis.USAGE_ONLY) {
        report({ context, generationId: state.generationId, call: { charge: AiChargeBasis.USAGE_ONLY, generationId: state.generationId } })
        return
    }
    recoverCostAndReport({ state, context }).catch(() => report({ context, generationId: state.generationId, call: undefined }))
}

async function recoverCostAndReport({ state, context }: SettleStreamParams): Promise<void> {
    const { generationId } = state
    const { apiKey } = context
    if (isNil(generationId) || isNil(apiKey)) {
        report({ context, generationId, call: undefined })
        return
    }
    const generation = await lookupGeneration({ apiKey, generationId })
    if (isNil(generation)) {
        report({ context, generationId, call: undefined })
        return
    }
    report({
        context,
        generationId,
        call: {
            charge: AiChargeBasis.PROVIDER_REPORTED_COST,
            generationId,
            costUsd: generation.costUsd,
            inputTokens: generation.inputTokens,
            outputTokens: generation.outputTokens,
            observedCostUsd: generation.costUsd,
        },
    })
}

function createBillingInfo({ context, generationId, providerMetadata, usage, headers }: CreateBillingInfoParams): ActivepiecesAiCall | undefined {
    const costUsd = openRouterCostOf(providerMetadata) ?? gatewayHeaderCostOf({ provider: context.provider, headers })
    const tokens = { ...tokensOf(usage), observedCostUsd: costUsd }
    if (context.basis === AiChargeBasis.FIXED_CREDITS) {
        return { ...createFixedCreditChargeInfo({ generationId }), ...tokens }
    }
    if (context.basis === AiChargeBasis.USAGE_ONLY) {
        return { charge: AiChargeBasis.USAGE_ONLY, generationId, ...tokens }
    }
    if (isNil(costUsd)) {
        return undefined
    }
    return { charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId, costUsd, ...tokens }
}

function createEmbeddingBillingInfo({ context, result, generationId }: CreateEmbeddingBillingInfoParams): ActivepiecesAiCall | undefined {
    const costUsd = openRouterCostOf(result.providerMetadata)
    const tokens = { inputTokens: result.usage?.tokens, observedCostUsd: costUsd }
    if (context.basis === AiChargeBasis.USAGE_ONLY) {
        return { charge: AiChargeBasis.USAGE_ONLY, generationId, ...tokens }
    }
    if (isNil(costUsd)) {
        return undefined
    }
    return { charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId, costUsd, ...tokens }
}

function createFixedCreditChargeInfo({ generationId }: { generationId?: string }): ActivepiecesAiCall {
    return { charge: AiChargeBasis.FIXED_CREDITS, credits: FIXED_CREDITS_PER_MODEL_CALL, generationId }
}

function tokensOf(usage: LanguageModelV4Usage | undefined): AiCallTokens {
    return {
        inputTokens: usage?.inputTokens?.total,
        outputTokens: usage?.outputTokens?.total,
        cacheReadTokens: usage?.inputTokens?.cacheRead,
        cacheWriteTokens: usage?.inputTokens?.cacheWrite,
        reasoningTokens: usage?.outputTokens?.reasoning,
    }
}

function openRouterCostOf(providerMetadata: SharedV4ProviderMetadata | undefined): number | undefined {
    const openRouter = providerMetadata?.['openrouter']
    if (isNil(openRouter)) {
        return undefined
    }
    const usage = openRouter['usage']
    if (!isJSONObject(usage)) {
        return undefined
    }
    return parseOrUndefined(OpenRouterUsage, usage)?.cost
}

function gatewayHeaderCostOf({ provider, headers }: { provider: AIProviderName, headers: ResponseHeaders }): number | undefined {
    if (provider !== AIProviderName.CUSTOM || isNil(headers)) {
        return undefined
    }
    const cost = Number(headers[LITELLM_COST_HEADER])
    return Number.isFinite(cost) && cost >= 0 ? cost : undefined
}

function parseOrUndefined<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> | undefined {
    const parsed = schema.safeParse(value)
    return parsed.success ? parsed.data : undefined
}

function report({ context, call, generationId }: ReportParams): void {
    if (isNil(call)) {
        recordUnbilledCall({ context, generationId, reason: isNil(generationId) ? UnbilledCallReason.NO_GENERATION_ID : UnbilledCallReason.PROVIDER_REPORTED_NO_COST })
        reporter?.({ billing: context.billing, provider: context.provider, ...spreadIfDefined('providerConfigId', context.providerConfigId), modelId: context.modelId, call: { charge: AiChargeBasis.USAGE_ONLY, generationId } })
        return
    }
    if (isNil(reporter)) {
        recordUnbilledCall({ context, generationId: call.generationId ?? generationId, reason: UnbilledCallReason.NO_REPORTER_INSTALLED })
        return
    }
    reporter({ billing: context.billing, provider: context.provider, ...spreadIfDefined('providerConfigId', context.providerConfigId), modelId: context.modelId, call })
}

function recordUnbilledCall({ context, generationId, reason }: RecordUnbilledCallParams): void {
    const unbilled: UnbilledCall = {
        reason,
        provider: context.provider,
        modelId: context.modelId,
        source: context.billing.source,
        platformId: context.billing.platformId,
        ...billingIdsOf(context.billing),
        generationId,
    }
    unbilledCalls = [...unbilledCalls, unbilled]
}

function billingIdsOf(billing: ActivepiecesAiBilling): UnbilledCallOwner {
    switch (billing.source) {
        case ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW:
            return { projectId: billing.projectId, flowRunId: billing.flowRun.flowRunId }
        case ActivepiecesAiConsumerSource.CHAT:
            return { conversationId: billing.conversationId, ...spreadIfDefined('projectId', billing.projectId) }
    }
}

function drainUnbilledCalls(): UnbilledCall[] {
    const drained = unbilledCalls
    unbilledCalls = []
    return drained
}

const EmbeddingResponseBody = z.object({
    id: z.string().min(1),
})

const OpenRouterUsage = z.object({
    cost: z.number().optional(),
})

let reporter: ActivepiecesAiCostReporter | undefined
const LITELLM_COST_HEADER = 'x-litellm-response-cost'
let unbilledCalls: UnbilledCall[] = []

const FIXED_CREDITS_PER_MODEL_CALL = 1

export const activepiecesAiCost = {
    setReporter: (next: ActivepiecesAiCostReporter): void => {
        reporter = next
    },
    drainUnbilledCalls,
    billedLanguageModel,
    billedEmbeddingModel,
    reportFixedCredits,
    reportProviderCost,
    openRouterCostOf,
}

type BillingContext = {
    basis: AiChargeBasis
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    providerConfigId?: string
    modelId: string
    apiKey?: string
}

type BillingContextParams = {
    provider: AIProviderName
    providerConfigId?: string
    modelId: string
    billing: ActivepiecesAiBilling | null | undefined
    charge: AiCharge | undefined
}

type BilledLanguageModelParams = {
    model: LanguageModel
    provider: AIProviderName
    providerConfigId?: string
    modelId: string
    billing: ActivepiecesAiBilling | null | undefined
    charge: AiCharge | undefined
}

type BilledEmbeddingModelParams = {
    model: EmbeddingModel
    provider: AIProviderName
    providerConfigId?: string
    modelId: string
    billing: ActivepiecesAiBilling | null | undefined
}

type ReportFixedCreditsParams = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    providerConfigId?: string
    modelId: string
    generationId?: string
}

type ReportProviderCostParams = ReportFixedCreditsParams & AiCallTokens & {
    costUsd?: number
}

type StreamState = {
    reported: boolean
    generationId?: string
    headers: ResponseHeaders
}

type BillGenerateParams = {
    doGenerate: () => PromiseLike<LanguageModelV4GenerateResult>
    context: BillingContext
}

type BillStreamParams = {
    doStream: () => PromiseLike<LanguageModelV4StreamResult>
    context: BillingContext
}

type BillEmbedParams = {
    doEmbed: () => PromiseLike<EmbeddingModelV4Result>
    context: BillingContext
}

type TrackChunkParams = {
    chunk: LanguageModelV4StreamPart
    controller: TransformStreamDefaultController<LanguageModelV4StreamPart>
    state: StreamState
    context: BillingContext
}

type SettleStreamParams = {
    state: StreamState
    context: BillingContext
}

type CreateBillingInfoParams = {
    context: BillingContext
    generationId: string | undefined
    providerMetadata: SharedV4ProviderMetadata | undefined
    usage: LanguageModelV4Usage | undefined
    headers?: ResponseHeaders
}

type ResponseHeaders = Record<string, string | undefined> | undefined

type ReportParams = {
    context: BillingContext
    call: ActivepiecesAiCall | undefined
    generationId?: string
}

type CreateEmbeddingBillingInfoParams = {
    context: BillingContext
    result: EmbeddingModelV4Result
    generationId: string | undefined
}

type RecordUnbilledCallParams = {
    context: BillingContext
    generationId: string | undefined
    reason: UnbilledCallReason
}

type UnbilledCallOwner = {
    projectId?: string
    flowRunId?: string
    conversationId?: string
}

export enum UnbilledCallReason {
    PROVIDER_REPORTED_NO_COST = 'provider-reported-no-cost',
    NO_GENERATION_ID = 'no-generation-id',
    NO_REPORTER_INSTALLED = 'no-reporter-installed',
}

export type UnbilledCall = UnbilledCallOwner & {
    reason: UnbilledCallReason
    provider: AIProviderName
    modelId: string
    source: ActivepiecesAiConsumerSource
    platformId: string
    generationId?: string
}

