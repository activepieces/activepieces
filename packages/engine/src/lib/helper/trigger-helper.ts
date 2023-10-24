import { AUTHENTICATION_PROPERTY_NAME, ApEdition, EventPayload, ExecuteTriggerOperation, ExecuteTriggerResponse, ExecutionState, PieceTrigger, ScheduleOptions, TriggerHookType } from '@activepieces/shared'
import { createContextStore } from '../services/storage.service'
import { VariableService } from '../services/variable-service'
import { pieceHelper } from './piece-helper'
import { isValidCron } from 'cron-validator'
import { PiecePropertyMap, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework'
import { createFilesService } from '../services/files.service'

type Listener = {
    events: string[]
    identifierValue: string
    identifierKey: string
}

export const triggerHelper = {
    async executeTrigger(params: ExecuteTriggerOperation<TriggerHookType>): Promise<ExecuteTriggerResponse<TriggerHookType>> {
        const { pieceName, pieceVersion, triggerName, input } = (params.flowVersion.trigger as PieceTrigger).settings

        const piece = await pieceHelper.loadPieceOrThrow(pieceName, pieceVersion)
        const trigger = piece.getTrigger(triggerName)

        if (trigger === undefined) {
            throw new Error(`trigger not found, pieceName=${pieceName}, triggerName=${triggerName}`)
        }

        const variableService = new VariableService()
        const executionState = new ExecutionState()

        const resolvedProps = await variableService.resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: input,
            executionState,
            logs: false,
        })

        const { processedInput, errors } = await variableService.applyProcessorsAndValidators(resolvedProps, trigger.props, piece.auth)

        if (Object.keys(errors).length > 0) {
            throw new Error(JSON.stringify(errors))
        }

        const appListeners: Listener[] = []
        const prefix = (params.hookType === TriggerHookType.TEST) ? 'test' : ''
        let scheduleOptions: ScheduleOptions | undefined = undefined
        const context = {
            store: createContextStore(prefix, params.flowVersion.flowId),
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
                }
            },
            webhookUrl: params.webhookUrl,
            auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
            propsValue: processedInput,
            payload: params.triggerPayload ?? {},
        }
        switch (params.hookType) {
            case TriggerHookType.ON_DISABLE:
                await trigger.onDisable(context)
                return {}
            case TriggerHookType.ON_ENABLE:
                await trigger.onEnable(context)
                return {
                    listeners: appListeners,
                    scheduleOptions: trigger.type === TriggerStrategy.POLLING ? scheduleOptions : undefined,
                }
            case TriggerHookType.HANDSHAKE: {
                try {
                    const response = await trigger.onHandshake(context)
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
                        output: await trigger.test({
                            ...context,
                            files: createFilesService({
                                stepName: triggerName,
                                flowId: params.flowVersion.flowId,
                                type: 'db',
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
                if (trigger.type === TriggerStrategy.APP_WEBHOOK) {
                    if (params.edition === ApEdition.COMMUNITY) {
                        return {
                            success: false,
                            message: 'App webhooks are not supported in community edition',
                            output: [],
                        }
                    }

                    if (!params.appWebhookUrl) {
                        throw new Error(`App webhook url is not avaiable for piece name ${pieceName}`)
                    }
                    if (!params.webhookSecret) {
                        throw new Error(`Webhook secret is not avaiable for piece name ${pieceName}`)
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
                const items = await trigger.run({
                    ...context,
                    files: createFilesService({
                        flowId: params.flowVersion.flowId,
                        stepName: triggerName,
                        type: 'memory',
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
