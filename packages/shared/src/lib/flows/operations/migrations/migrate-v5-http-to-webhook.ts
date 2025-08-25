import semver from 'semver'
import { FlowActionType } from '../../actions/action'
import { FlowVersion } from '../../flow-version'
import { PropertyExecutionType } from '../../properties'
import { flowStructureUtil } from '../../util/flow-structure-util'
import { Migration } from '.'

const HTTP_PIECE_NAME = '@activepieces/piece-http'
const WEBHOOK_PIECE_NAME = '@activepieces/piece-webhook'
const HTTP_RETURN_RESPONSE_ACTION = 'return_response'
const WEBHOOK_RETURN_RESPONSE_ACTION = 'return_response'

export const migrateHttpToWebhookV5: Migration = {
    targetSchemaVersion: '5',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (
                step.type === FlowActionType.PIECE &&
                step.settings.pieceName === HTTP_PIECE_NAME &&
                step.settings.actionName === HTTP_RETURN_RESPONSE_ACTION
            ) {
                const httpInput = step.settings.input || {}
                const fields: Record<string, unknown> = {}
                const pieceVersionWithoutTildaOrPlus = step.settings.pieceVersion.replace('~', '').replace('^', '')
                // Check the scehma for each action in the http piece
                const isGreaterThanOrEqual050 = semver.gte(pieceVersionWithoutTildaOrPlus, '0.5.0')

                if (httpInput['body'] && typeof httpInput['body'] === 'object' && 'data' in httpInput['body'] && isGreaterThanOrEqual050) {
                    fields['body'] = (httpInput['body'] as Record<string, unknown>)['data']
                }

                if (httpInput['body'] && typeof httpInput['body'] === 'object' && !isGreaterThanOrEqual050) {
                    fields['body'] = (httpInput['body'] as Record<string, unknown>)
                }
           


                if (httpInput['status'] !== undefined) {
                    fields['status'] = httpInput['status']
                }
                if (httpInput['headers']) {
                    fields['headers'] = httpInput['headers']
                }
                
                const webhookInput = {
                    respond: 'stop',
                    responseType: httpInput['body_type'] || 'json',
                    fields,
                }
                
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceName: WEBHOOK_PIECE_NAME,
                        pieceVersion: '0.1.20',
                        actionName: WEBHOOK_RETURN_RESPONSE_ACTION,
                        input: webhookInput,
                        propertySettings: {
                            ...step.settings.propertySettings,
                            'respond': {
                                type: PropertyExecutionType.MANUAL,
                                schema: undefined,
                            },
                            'responseType': {
                                type: PropertyExecutionType.MANUAL,
                                schema: undefined,
                            },
                            'fields': {
                                type: PropertyExecutionType.MANUAL,
                                schema: undefined,
                            },
                        },
                    },
                }
            }
            return step
        })
        
        return {
            ...newVersion,
            schemaVersion: '6',
        }
    },
}