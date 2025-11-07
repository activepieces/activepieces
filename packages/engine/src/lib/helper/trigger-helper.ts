import { inspect } from 'node:util'
import { PiecePropertyMap, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework'
import { assertEqual, AUTHENTICATION_PROPERTY_NAME, EventPayload, ExecuteTriggerOperation, ExecuteTriggerResponse, FlowTrigger, isNil, PieceTrigger, PropertySettings, ScheduleOptions, TriggerHookType, TriggerSourceScheduleType } from '@activepieces/shared'
import { isValidCron } from 'cron-validator'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createFlowsContext } from '../services/flows.service'
import { createFilesService } from '../services/step-files.service'
import { createContextStore } from '../services/storage.service'
import { utils } from '../utils'
import { propsProcessor } from '../variables/props-processor'
import { createPropsResolver } from '../variables/props-resolver'
import { EngineGenericError } from './execution-errors'
import { pieceLoader } from './piece-loader'

type Listener = {
    events: string[]
    identifierValue: string
    identifierKey: string
}

export const triggerHelper = {
    async executeOnStart(trigger: FlowTrigger, constants: EngineConstants, payload: unknown) {
        const { pieceName, pieceVersion, triggerName, input, propertySettings } = (trigger as PieceTrigger).settings

        if (isNil(triggerName)) {
            throw new EngineGenericError('TriggerNameNotSetError', 'Trigger name is not set')
        }

        const { pieceTrigger, processedInput } = await prepareTriggerExecution({
            pieceName,
            pieceVersion,
            triggerName,
            input,
            projectId: constants.projectId,
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            pieceSource: constants.piecesSource,
            propertySettings,
        })
        const isOldVersionOrNotSupported = isNil(pieceTrigger.onStart)
        if (isOldVersionOrNotSupported) {
            return
        }
        const context = {
            store: createContextStore({
                apiUrl: constants.internalApiUrl,
                prefix: '',
                flowId: constants.flowId,
                engineToken: constants.engineToken,
            }),
            auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
            propsValue: processedInput,
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
            }),
        }

        await pieceTrigger.onStart(context)
    },

    async executeTrigger({ params, constants }: ExecuteTriggerParams): Promise<ExecuteTriggerResponse<TriggerHookType>> {
        const { pieceName, pieceVersion, triggerName, input, propertySettings } = (params.flowVersion.trigger as PieceTrigger).settings

        if (isNil(triggerName)) {
            throw new EngineGenericError('TriggerNameNotSetError', 'Trigger name is not set')
        }

        const { piece, pieceTrigger, processedInput } = await prepareTriggerExecution({
            pieceName,
            pieceVersion,
            triggerName,
            input,
            projectId: params.projectId,
            apiUrl: constants.internalApiUrl,
            engineToken: params.engineToken,
            pieceSource: constants.piecesSource,
            propertySettings,
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
            setSchedule(request: ScheduleOptions) {
                if (!isValidCron(request.cronExpression)) {
                    throw new EngineGenericError('InvalidCronExpressionError', `Invalid cron expression: ${request.cronExpression}`)
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
            auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
            propsValue: processedInput,
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
            }),
        }
        switch (params.hookType) {
            case TriggerHookType.ON_DISABLE: {
                await pieceTrigger.onDisable(context)
                return {}
            }
            case TriggerHookType.ON_ENABLE: {
                await pieceTrigger.onEnable(context)
                return {
                    listeners: appListeners,
                    scheduleOptions: pieceTrigger.type === TriggerStrategy.POLLING ? scheduleOptions : undefined,
                }
            }
            case TriggerHookType.RENEW: {
                assertEqual(pieceTrigger.type, TriggerStrategy.WEBHOOK, 'triggerType', 'WEBHOOK')
                await pieceTrigger.onRenew(context)
                return {
                    success: true,
                }
            }
            case TriggerHookType.HANDSHAKE: {
                const { data: handshakeResponse, error: handshakeResponseError } = await utils.tryCatchAndThrowOnEngineError(() => pieceTrigger.onHandshake(context))

                if (handshakeResponseError) {
                    console.error(handshakeResponseError)
                    return {
                        success: false,
                        message: `Error while testing trigger: ${inspect(handshakeResponseError)}`,
                    }
                }
                return {
                    success: true,
                    response: handshakeResponse,
                }
            }
            case TriggerHookType.TEST: {
                const { data: testResponse, error: testResponseError } = await utils.tryCatchAndThrowOnEngineError(() => pieceTrigger.test({
                    ...context,
                    files: createFilesService({
                        apiUrl: constants.internalApiUrl,
                        engineToken: params.engineToken!,
                        stepName: triggerName,
                        flowId: params.flowVersion.flowId,
                    }),
                }))

                if (testResponseError) {
                    console.error(testResponseError)
                    return {
                        success: false,
                        message: `Error while testing trigger: ${inspect(testResponseError)}`,
                        output: [],
                    }
                }
                return {
                    success: true,
                    output: testResponse,
                }
            }
            case TriggerHookType.RUN: {
                if (pieceTrigger.type === TriggerStrategy.APP_WEBHOOK) {

                    const { data: verified, error: verifiedError } = await utils.tryCatchAndThrowOnEngineError(async () => {
                        if (!params.appWebhookUrl) {
                            throw new EngineGenericError('AppWebhookUrlNotAvailableError', `App webhook url is not available for piece name ${pieceName}`)
                        }
                        if (!params.webhookSecret) {
                            throw new EngineGenericError('WebhookSecretNotAvailableError', `Webhook secret is not available for piece name ${pieceName}`)
                        }

                        return piece.events?.verify({
                            appWebhookUrl: params.appWebhookUrl,
                            payload: params.triggerPayload as EventPayload,
                            webhookSecret: params.webhookSecret,
                        })
                    })

                    if (verifiedError) {
                        return {
                            success: false,
                            message: `Error while verifying webhook: ${inspect(verifiedError)}`,
                            output: [],
                        }
                    }
                    if (isNil(verified)) {
                        return {
                            success: false,
                            message: 'Webhook is not verified',
                            output: [],
                        }
                    }
                }

                const { data: triggerRunResult, error: triggerRunError } = await utils.tryCatchAndThrowOnEngineError(async () => {
                    const items = await pieceTrigger.run({
                        ...context,
                        files: createFilesService({
                            apiUrl: constants.internalApiUrl,
                            engineToken: params.engineToken!,
                            flowId: params.flowVersion.flowId,
                            stepName: triggerName,
                        }),
                    })
                    return {
                        success: true,
                        output: items,
                    }
                })

                if (triggerRunError) {
                    return {
                        success: false,
                        message: triggerRunError.message,
                        output: [],
                    }
                }
                return triggerRunResult
            }
        }
    },
}

type ExecuteTriggerParams = {
    params: ExecuteTriggerOperation<TriggerHookType>
    constants: EngineConstants
}

async function prepareTriggerExecution({ pieceName, pieceVersion, triggerName, input, propertySettings, projectId, apiUrl, engineToken, pieceSource }: PrepareTriggerExecutionParams) {
    const { piece, pieceTrigger } = await pieceLoader.getPieceAndTriggerOrThrow({
        pieceName,
        pieceVersion,
        triggerName,
        pieceSource,
    })

    const { resolvedInput } = await createPropsResolver({
        apiUrl,
        projectId,
        engineToken,
    }).resolve<StaticPropsValue<PiecePropertyMap>>({
        unresolvedInput: input,
        executionState: FlowExecutorContext.empty(),
    })

    const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(resolvedInput, pieceTrigger.props, piece.auth, pieceTrigger.requireAuth, propertySettings)

    if (Object.keys(errors).length > 0) {
        throw new Error(JSON.stringify(errors, null, 2))
    }

    return { piece, pieceTrigger, processedInput }
}

type PrepareTriggerExecutionParams = {
    pieceName: string
    pieceVersion: string
    triggerName: string
    input: unknown
    propertySettings: Record<string, PropertySettings>
    projectId: string
    apiUrl: string
    engineToken: string
    pieceSource: string
}
