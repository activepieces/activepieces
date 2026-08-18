import { assertEqual, isNil, isObject } from '@activepieces/core-utils'
import { PiecePropertyMap, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework'
import { EngineGenericError, EngineHttpResponse, ExecuteTriggerResponse, FlowTrigger, PieceTrigger, PropertySettings, TriggerHookType } from '@activepieces/shared'
import { EngineConstants, ResolvedExecuteTriggerOperation } from '../../handler/context/engine-constants'
import { FlowExecutorContext } from '../../handler/context/flow-execution-context'
import { buildRuntime } from '../../handler/piece-executor'
import { createPropsResolver } from '../../variables/props-resolver'
import { CollectedHooks, TriggerContextRequest } from './piece-protocol'
import { PieceRef, pieceRunner } from './piece-runner'

export const triggerRunner = {
    async executeOnStart({ trigger, constants, payload }: ExecuteOnStartParams): Promise<void> {
        const { pieceName, pieceVersion, triggerName, input, propertySettings } = (trigger as PieceTrigger).settings
        assertTriggerName(triggerName)

        const piece: PieceRef = { pieceName, pieceVersion, devPieces: constants.devPieces }
        const description = await pieceRunner.describe(piece)
        if (!description.hasPath(['triggers', triggerName, 'onStart'])) {
            return
        }
        await pieceRunner.call({
            piece,
            path: ['triggers', triggerName, 'onStart'],
            context: await buildTriggerContext({
                piece,
                constants,
                triggerName,
                input,
                propertySettings,
                contextVersion: description.metadata.contextInfo?.version,
                payload,
                storePrefix: '',
                includeFiles: false,
            }),
        })
    },

    async executeTrigger({ params, constants }: ExecuteTriggerParams): Promise<ExecuteTriggerResponse<TriggerHookType>> {
        const { pieceName, pieceVersion, triggerName, input, propertySettings } = (params.flowVersion.trigger as PieceTrigger).settings
        assertTriggerName(triggerName)

        const piece: PieceRef = { pieceName, pieceVersion, devPieces: constants.devPieces }
        const description = await pieceRunner.describe(piece)
        const pieceTrigger = description.metadata.triggers[triggerName]
        if (isNil(pieceTrigger)) {
            throw new EngineGenericError('TriggerNotFoundError', `Trigger not found, pieceName=${pieceName}, triggerName=${triggerName}`)
        }

        const context = await buildTriggerContext({
            piece,
            constants,
            triggerName,
            input,
            propertySettings,
            contextVersion: description.metadata.contextInfo?.version,
            payload: params.triggerPayload,
            storePrefix: params.test ? 'test' : '',
            includeFiles: params.hookType === TriggerHookType.TEST || params.hookType === TriggerHookType.RUN,
            webhookUrl: params.webhookUrl,
            isRepublish: params.isRepublish,
        })
        const runHook = async (methodName: string): Promise<{ result: unknown, hooks?: CollectedHooks }> =>
            pieceRunner.call({ piece, path: ['triggers', triggerName, methodName], context })

        switch (params.hookType) {
            case TriggerHookType.ON_DISABLE: {
                await runHook('onDisable')
                return {}
            }
            case TriggerHookType.ON_ENABLE: {
                const { hooks } = await runHook('onEnable')
                return {
                    listeners: hooks?.listeners ?? [],
                    scheduleOptions: pieceTrigger.type === TriggerStrategy.POLLING ? hooks?.scheduleOptions : undefined,
                }
            }
            case TriggerHookType.RENEW: {
                assertEqual(pieceTrigger.type, TriggerStrategy.WEBHOOK, 'triggerType', 'WEBHOOK')
                await runHook('onRenew')
                return {}
            }
            case TriggerHookType.HANDSHAKE: {
                const { result } = await runHook('onHandshake')
                return { response: toWebhookResponse(result) }
            }
            case TriggerHookType.TEST: {
                const { result } = await runHook('test')
                return { output: toItems(result) }
            }
            case TriggerHookType.RUN: {
                if (pieceTrigger.type === TriggerStrategy.APP_WEBHOOK) {
                    await verifyAppWebhook({ piece, description, params, pieceName })
                }
                const { result } = await runHook('run')
                return { output: toItems(result) }
            }
        }
    },
}

async function buildTriggerContext({ piece, constants, triggerName, input, propertySettings, contextVersion, payload, storePrefix, includeFiles, webhookUrl, isRepublish }: BuildTriggerContextParams): Promise<TriggerContextRequest> {
    const { resolvedInput } = await createPropsResolver({
        apiUrl: constants.internalApiUrl,
        projectId: constants.projectId,
        engineToken: constants.engineToken,
        contextVersion,
        stepNames: constants.stepNames,
        pieceName: piece.pieceName,
    }).resolve<StaticPropsValue<PiecePropertyMap>>({
        unresolvedInput: input,
        executionState: FlowExecutorContext.empty(),
    })

    return {
        kind: 'trigger',
        runtime: buildRuntime({ constants, pieceName: piece.pieceName, contextVersion }),
        stepName: triggerName,
        resolvedInput,
        propertySettings,
        payload,
        storePrefix,
        includeFiles,
        webhookUrl,
        isRepublish,
    }
}

async function verifyAppWebhook({ piece, description, params, pieceName }: VerifyAppWebhookParams): Promise<void> {
    if (!params.appWebhookUrl) {
        throw new EngineGenericError('AppWebhookUrlNotAvailableError', `App webhook url is not available for piece name ${pieceName}`)
    }
    if (!params.webhookSecret) {
        throw new EngineGenericError('WebhookSecretNotAvailableError', `Webhook secret is not available for piece name ${pieceName}`)
    }
    if (!description.hasPath(['events', 'verify'])) {
        throw new Error('Webhook is not verified')
    }
    const { result } = await pieceRunner.call({
        piece,
        path: ['events', 'verify'],
        args: [{
            appWebhookUrl: params.appWebhookUrl,
            payload: params.triggerPayload,
            webhookSecret: params.webhookSecret,
        }],
    })
    if (result !== true) {
        throw new Error('Webhook is not verified')
    }
}

function assertTriggerName(triggerName: string | undefined): asserts triggerName is string {
    if (isNil(triggerName)) {
        throw new EngineGenericError('TriggerNameNotSetError', 'Trigger name is not set')
    }
}

function toItems(value: unknown): unknown[] {
    if (!Array.isArray(value)) {
        throw new EngineGenericError('TriggerOutputNotArrayError', `Trigger returned ${typeof value} instead of an array of items`)
    }
    return value
}

function toWebhookResponse(value: unknown): { status: number, body?: unknown, headers?: Record<string, string> } | undefined {
    if (!isObject(value)) {
        return undefined
    }
    return {
        status: typeof value.status === 'number' ? value.status : 200,
        body: value.body,
        headers: EngineHttpResponse.shape.headers.safeParse(value.headers).data ?? {},
    }
}

type ExecuteOnStartParams = {
    trigger: FlowTrigger
    constants: EngineConstants
    payload: unknown
}

type ExecuteTriggerParams = {
    params: ResolvedExecuteTriggerOperation<TriggerHookType>
    constants: EngineConstants
}

type BuildTriggerContextParams = {
    piece: PieceRef
    constants: EngineConstants
    triggerName: string
    input: unknown
    propertySettings: Record<string, PropertySettings>
    contextVersion: TriggerContextRequest['runtime']['contextVersion']
    payload: unknown
    storePrefix: string
    includeFiles: boolean
    webhookUrl?: string
    isRepublish?: boolean
}

type VerifyAppWebhookParams = {
    piece: PieceRef
    description: Awaited<ReturnType<typeof pieceRunner.describe>>
    params: ResolvedExecuteTriggerOperation<TriggerHookType>
    pieceName: string
}
