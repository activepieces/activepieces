import { ActivepiecesError, CreateTemplateRequestBody, ErrorCode, FlowOperationRequest, flowOperations, FlowOperationType, FlowVersion, FlowVersionState, FlowVersionTemplate, PlatformId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowVersionValidationUtil } from '../flows/flow-version/flow-version-validator-util'

function createMinimalFlowVersion(template: FlowVersionTemplate): FlowVersion {
    return {
        ...template,
        id: 'temp-id',
        flowId: 'temp-flow-id',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        state: FlowVersionState.DRAFT,
        updatedBy: null,
        agentIds: [],
        connectionIds: [],
        backupFiles: null,
    }
}

export const templateValidator = {
    async validate({ template, platformId, log }: ValidateParams): Promise<void> {
        const { flows } = template
        
        if (!flows || flows.length === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Flows are required',
                },
            })
        }
        
        await Promise.all(flows.map(async (flow) => {
            const minimalFlowVersion = createMinimalFlowVersion(flow)
            
            const importRequest = {
                displayName: flow.displayName,
                trigger: flow.trigger,
                schemaVersion: flow.schemaVersion,
            }

            const importOperation: FlowOperationRequest = { 
                type: FlowOperationType.IMPORT_FLOW, 
                request: importRequest, 
            }

            const validator = flowVersionValidationUtil(log)

            await validator.prepareRequest({ platformId, request: importOperation })
            
            flowOperations.apply(minimalFlowVersion, importOperation)
        }))
    },
}

type ValidateParams = {
    template: CreateTemplateRequestBody
    platformId?: PlatformId
    log: FastifyBaseLogger
}