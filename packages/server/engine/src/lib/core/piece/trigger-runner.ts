import { assertEqual, isNil, isObject } from '@activepieces/core-utils'
import { ContextVersion, PiecePropertyMap, SetScheduleRequest, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework'
import { AUTHENTICATION_PROPERTY_NAME, EngineGenericError, EngineHttpResponse, ExecuteTriggerResponse, FlowTrigger, InvalidCronExpressionError, InvalidScheduleIntervalError, PieceTrigger, PropertySettings, ScheduleOptions, TriggerHookType, TriggerSourceScheduleType } from '@activepieces/shared'
import { isValidCron } from 'cron-validator'
import { EngineConstants, ResolvedExecuteTriggerOperation } from '../../handler/context/engine-constants'
import { FlowExecutorContext } from '../../handler/context/flow-execution-context'
import { createFileUploader } from '../../piece-context/file-uploader'
import { createFlowsContext } from '../../piece-context/flows'
import { createContextStore } from '../../piece-context/store'
import { utils } from '../../utils'
import { propsProcessor } from '../../variables/props-processor'
import { createPropsResolver } from '../../variables/props-resolver'
import { PieceRef, pieceRunner } from './piece-runner'

export const triggerRunner = {
    async executeOnStart(trigger: FlowTrigger, constants: EngineConstants, payload: unknown): Promise<void> {
        const { pieceName, pieceVersion, triggerName, input, propertySettings } = (trigger as PieceTrigger).settings

        if (isNil(triggerName)) {
            throw new EngineGenericError('TriggerNameNotSetError', 'Trigger name is not set')
        }

        const prepared = await prepareTriggerExecution({
            piece: { pieceName, pieceVersion, devPieces: constants.devPieces },
            triggerName,
            input,
            projectId: constants.projectId,
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            propertySettings,
            stepNames: constants.stepNames,
        })
        if (!prepared.hasMethod('onStart')) {
            return
        }
        const context = {
            store: createContextStore({
                apiUrl: constants.internalApiUrl,
                prefix: '',
                flowId: constants.flowId,
                engineToken: constants.engineToken,
            }),
            auth: prepared.processedInput[AUTHENTICATION_PROPERTY_NAME],
            propsValue: prepared.processedInput,
            payload,
            run: {
                id: constants.flowRunId,
            },
            step: {
                name: triggerName,
            },
            project: {
                id: constants.projectId,
                externalId: constants.externalProjectId,
            },
            connections: utils.createConnectionManager({
                apiUrl: constants.internalApiUrl,
                projectId: constants.projectId,
                engineToken: constants.engineToken,
                target: 'triggers',
                contextVersion: prepared.contextVersion,
                pieceName,
            }),
        }
        await prepared.call({ methodName: 'onStart', context })
    },

    async executeTrigger({ params, constants }: ExecuteTriggerParams): Promise<ExecuteTriggerResponse<TriggerHookType>> {
        const { pieceName, pieceVersion, triggerName, input, propertySettings } = (params.flowVersion.trigger as PieceTrigger).settings

        if (isNil(triggerName)) {
            throw new EngineGenericError('TriggerNameNotSetError', 'Trigger name is not set')
        }

        const piece: PieceRef = { pieceName, pieceVersion, devPieces: constants.devPieces }
        const prepared = await prepareTriggerExecution({
            piece,
            triggerName,
            input,
            projectId: params.projectId,
            apiUrl: constants.internalApiUrl,
            engineToken: params.engineToken,
            propertySettings,
            stepNames: constants.stepNames,
        })

        const appListeners: Listener[] = []
        const prefix = params.test ? 'test' : ''
        let scheduleOptions: ScheduleOptions | undefined = undefined
        const context = {
            store: createContextStore({
                apiUrl: constants.internalApiUrl,
                prefix,
                flowId: params.flowVersion.flowId,
                engineToken: params.engineToken,
            }),
            step: {
                name: triggerName,
            },
            app: {
                createListeners({ events, identifierKey, identifierValue }: Listener): void {
                    appListeners.push({ events, identifierValue, identifierKey })
                },
            },
            setSchedule(request: SetScheduleRequest) {
                if ('intervalMs' in request) {
                    const parsed = ScheduleOptions.safeParse({
                        type: TriggerSourceScheduleType.INTERVAL,
                        intervalMs: request.intervalMs,
                    })
                    if (!parsed.success) {
                        throw new InvalidScheduleIntervalError(request.intervalMs)
                    }
                    scheduleOptions = parsed.data
                    return
                }
                if (!isValidCron(request.cronExpression)) {
                    throw new InvalidCronExpressionError(request.cronExpression)
                }
                scheduleOptions = {
                    type: TriggerSourceScheduleType.CRON_EXPRESSION,
                    cronExpression: request.cronExpression,
                    timezone: request.timezone ?? 'UTC',
                }
            },
            flows: createFlowsContext({
                engineToken: params.engineToken,
                internalApiUrl: constants.internalApiUrl,
                flowId: params.flowVersion.flowId,
                flowVersionId: params.flowVersion.id,
            }),
            webhookUrl: params.webhookUrl,
            isRepublish: params.isRepublish,
            auth: prepared.processedInput[AUTHENTICATION_PROPERTY_NAME],
            propsValue: prepared.processedInput,
            payload: params.triggerPayload ?? {},
            project: {
                id: params.projectId,
                externalId: constants.externalProjectId,
            },
            server: {
                token: params.engineToken,
                apiUrl: constants.internalApiUrl,
                publicUrl: params.publicApiUrl,
            },
            connections: utils.createConnectionManager({
                apiUrl: constants.internalApiUrl,
                projectId: constants.projectId,
                engineToken: constants.engineToken,
                target: 'triggers',
                contextVersion: prepared.contextVersion,
                pieceName,
            }),
        }
        const contextWithFiles = {
            ...context,
            files: createFileUploader({
                apiUrl: constants.internalApiUrl,
                engineToken: params.engineToken!,
            }),
        }

        switch (params.hookType) {
            case TriggerHookType.ON_DISABLE: {
                await prepared.call({ methodName: 'onDisable', context })
                return {}
            }
            case TriggerHookType.ON_ENABLE: {
                await prepared.call({ methodName: 'onEnable', context })
                return {
                    listeners: appListeners,
                    scheduleOptions: prepared.triggerType === TriggerStrategy.POLLING ? scheduleOptions : undefined,
                }
            }
            case TriggerHookType.RENEW: {
                assertEqual(prepared.triggerType, TriggerStrategy.WEBHOOK, 'triggerType', 'WEBHOOK')
                await prepared.call({ methodName: 'onRenew', context })
                return {}
            }
            case TriggerHookType.HANDSHAKE: {
                return {
                    response: toWebhookResponse(await prepared.call({ methodName: 'onHandshake', context })),
                }
            }
            case TriggerHookType.TEST: {
                return {
                    output: toItems(await prepared.call({ methodName: 'test', context: contextWithFiles })),
                }
            }
            case TriggerHookType.RUN: {
                if (prepared.triggerType === TriggerStrategy.APP_WEBHOOK) {
                    if (!params.appWebhookUrl) {
                        throw new EngineGenericError('AppWebhookUrlNotAvailableError', `App webhook url is not available for piece name ${pieceName}`)
                    }
                    if (!params.webhookSecret) {
                        throw new EngineGenericError('WebhookSecretNotAvailableError', `Webhook secret is not available for piece name ${pieceName}`)
                    }
                    const verified = prepared.hasPath(['events', 'verify']) && await pieceRunner.call({
                        piece,
                        path: ['events', 'verify'],
                        args: [{
                            appWebhookUrl: params.appWebhookUrl,
                            payload: params.triggerPayload,
                            webhookSecret: params.webhookSecret,
                        }],
                    })
                    if (isNil(verified) || verified === false) {
                        throw new Error('Webhook is not verified')
                    }
                }

                return {
                    output: toItems(await prepared.call({ methodName: 'run', context: contextWithFiles })),
                }
            }
        }
    },
}

async function prepareTriggerExecution({ piece, triggerName, input, propertySettings, projectId, apiUrl, engineToken, stepNames }: PrepareTriggerExecutionParams): Promise<PreparedTrigger> {
    const description = await pieceRunner.describe(piece)
    const pieceTrigger = description.metadata.triggers[triggerName]

    if (isNil(pieceTrigger)) {
        throw new EngineGenericError('TriggerNotFoundError', `Trigger not found, pieceName=${piece.pieceName}, triggerName=${triggerName}`)
    }

    const contextVersion = description.metadata.contextInfo?.version
    const { resolvedInput } = await createPropsResolver({
        apiUrl,
        projectId,
        engineToken,
        contextVersion,
        stepNames,
        pieceName: piece.pieceName,
    }).resolve<StaticPropsValue<PiecePropertyMap>>({
        unresolvedInput: input,
        executionState: FlowExecutorContext.empty(),
    })

    const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(resolvedInput, pieceTrigger.props, description.metadata.auth, pieceTrigger.requireAuth, propertySettings)

    if (Object.keys(errors).length > 0) {
        throw new Error(JSON.stringify(errors, null, 2))
    }

    return {
        processedInput,
        contextVersion,
        triggerType: pieceTrigger.type,
        hasPath: description.hasPath,
        hasMethod: (methodName: string) => description.hasPath(['triggers', triggerName, methodName]),
        call: ({ methodName, context }) => pieceRunner.call({ piece, path: ['triggers', triggerName, methodName], args: [context] }),
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
        headers: isObject(value.headers) ? EngineHttpResponse.shape.headers.parse(value.headers) : {},
    }
}

type Listener = {
    events: string[]
    identifierValue: string
    identifierKey: string
}

type ExecuteTriggerParams = {
    params: ResolvedExecuteTriggerOperation<TriggerHookType>
    constants: EngineConstants
}

type PrepareTriggerExecutionParams = {
    piece: PieceRef
    triggerName: string
    input: unknown
    propertySettings: Record<string, PropertySettings>
    projectId: string
    apiUrl: string
    engineToken: string
    stepNames: string[]
}

type PreparedTrigger = {
    processedInput: StaticPropsValue<PiecePropertyMap>
    contextVersion: ContextVersion | undefined
    triggerType: TriggerStrategy
    hasPath: (path: string[]) => boolean
    hasMethod: (methodName: string) => boolean
    call: (params: { methodName: string, context: unknown }) => Promise<unknown>
}
