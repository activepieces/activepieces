import { PiecePropertyMap, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework'
import { assertEqual, assertNotNullOrUndefined, AUTHENTICATION_PROPERTY_NAME, EventPayload, ExecuteTriggerOperation, ExecuteTriggerResponse, isNil, PieceTrigger, ScheduleOptions, Trigger, TriggerHookType } from '@activepieces/shared'
import { isValidCron } from 'cron-validator'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createFilesService } from '../services/files.service'
import { createFlowsContext } from '../services/flows.service'
import { createContextStore } from '../services/storage.service'
import { propsProcessor } from '../variables/props-processor'
import { createPropsResolver } from '../variables/props-resolver'
import { pieceLoader } from './piece-loader'

type Listener = {
    events: string[]
    identifierValue: string
    identifierKey: string
}

export const triggerHelper = {
    async executeOnStart(trigger: Trigger, constants: EngineConstants, payload: unknown) {
        const { pieceName, pieceVersion, triggerName, input } = (trigger as PieceTrigger).settings
        assertNotNullOrUndefined(triggerName, 'triggerName is required')
        const { pieceTrigger, processedInput } = await prepareTriggerExecution({
            pieceName,
            pieceVersion,
            triggerName,
            input,
            projectId: constants.projectId,
            apiUrl: constants.internalApiUrl,
            engineToken: constants.engineToken,
            piecesSource: constants.piecesSource,
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
            project: {
                id: constants.projectId,
                externalId: constants.externalProjectId,
            },
        }

        await pieceTrigger.onStart(context)
    },

    async executeTrigger({ params, constants }: ExecuteTriggerParams): Promise<ExecuteTriggerResponse<TriggerHookType>> {
        const { pieceName, pieceVersion, triggerName, input } = (params.flowVersion.trigger as PieceTrigger).settings
        assertNotNullOrUndefined(triggerName, 'triggerName is required')

        const { piece, pieceTrigger, processedInput } = await prepareTriggerExecution({
            pieceName,
            pieceVersion,
            triggerName,
            input,
            projectId: params.projectId,
            apiUrl: constants.internalApiUrl,
            engineToken: params.engineToken,
            piecesSource: constants.piecesSource,
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
            app: {
                createListeners({ events, identifierKey, identifierValue }: Listener): void {
                    appListeners.push({ events, identifierValue, identifierKey })
                },
            },
            setSchedule(request: ScheduleOptions) {
                if (!isValidCron(request.cronExpression)) {
                    throw new Error(`Invalid cron expression: ${request.cronExpression}`)
                }
                scheduleOptions = {
                    cronExpression: request.cronExpression,
                    timezone: request.timezone ?? 'UTC',
                    failureCount: request.failureCount ?? 0,
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
        }
        switch (params.hookType) {
            case TriggerHookType.ON_DISABLE:
                await pieceTrigger.onDisable(context)
                return {}
            case TriggerHookType.ON_ENABLE:
                await pieceTrigger.onEnable(context)
                return {
                    listeners: appListeners,
                    scheduleOptions: pieceTrigger.type === TriggerStrategy.POLLING ? scheduleOptions : undefined,
                }
            case TriggerHookType.RENEW:
                assertEqual(pieceTrigger.type, TriggerStrategy.WEBHOOK, 'triggerType', 'WEBHOOK')
                await pieceTrigger.onRenew(context)
                return {
                    success: true,
                }
            case TriggerHookType.HANDSHAKE: {
                try {
                    const response = await pieceTrigger.onHandshake(context)
                    return {
                        success: true,
                        response,
                    }
                }
                catch (e) {
                    console.error(e)

                    return {
                        success: false,
                        message: JSON.stringify(e),
                    }
                }
            }
            case TriggerHookType.TEST:
                try {
                    return {
                        success: true,
                        output: await pieceTrigger.test({
                            ...context,
                            files: createFilesService({
                                apiUrl: constants.internalApiUrl,
                                engineToken: params.engineToken!,
                                stepName: triggerName,
                                flowId: params.flowVersion.flowId,
                            }),
                        }),
                    }
                }
                catch (e) {
                    console.error(e)

                    return {
                        success: false,
                        message: JSON.stringify(e),
                        output: [],
                    }
                }
            case TriggerHookType.RUN: {
                if (pieceTrigger.type === TriggerStrategy.APP_WEBHOOK) {
                    if (!params.appWebhookUrl) {
                        throw new Error(`App webhook url is not available for piece name ${pieceName}`)
                    }
                    if (!params.webhookSecret) {
                        throw new Error(`Webhook secret is not available for piece name ${pieceName}`)
                    }

                    try {
                        const verified = piece.events?.verify({
                            appWebhookUrl: params.appWebhookUrl,
                            payload: params.triggerPayload as EventPayload,
                            webhookSecret: params.webhookSecret,
                        })

                        if (verified === false) {
                            console.info('Webhook is not verified')
                            return {
                                success: false,
                                message: 'Webhook is not verified',
                                output: [],
                            }
                        }
                    }
                    catch (e) {
                        console.error('Error while verifying webhook', e)
                        return {
                            success: false,
                            message: 'Error while verifying webhook',
                            output: [],
                        }
                    }
                }
                const items = await pieceTrigger.run({
                    ...context,
                    files: createFilesService({
                        apiUrl: constants.internalApiUrl,
                        engineToken: params.engineToken!,
                        flowId: params.flowVersion.flowId,
                        stepName: triggerName,
                    }),
                })
                if (!Array.isArray(items)) {
                    throw new Error(`Trigger run should return an array of items, but returned ${typeof items}`)
                }
                return {
                    success: true,
                    output: items,
                }
            }
        }
    },
}

type ExecuteTriggerParams = {
    params: ExecuteTriggerOperation<TriggerHookType>
    constants: EngineConstants
}

async function prepareTriggerExecution({ pieceName, pieceVersion, triggerName, input, projectId, apiUrl, engineToken, piecesSource }: PrepareTriggerExecutionParams) {
    const { piece, pieceTrigger } = await pieceLoader.getPieceAndTriggerOrThrow({
        pieceName,
        pieceVersion,
        triggerName,
        piecesSource,
    })

    const { resolvedInput } = await createPropsResolver({
        apiUrl,
        projectId,
        engineToken,
    }).resolve<StaticPropsValue<PiecePropertyMap>>({
        unresolvedInput: input,
        executionState: FlowExecutorContext.empty(),
    })

    const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(resolvedInput, pieceTrigger.props, piece.auth, pieceTrigger.requireAuth)

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
    projectId: string
    apiUrl: string
    engineToken: string
    piecesSource: string
}
