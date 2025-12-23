import { ActivepiecesError, CreateTemplateRequestBody, ErrorCode, FlowOperationRequest, flowOperations, FlowOperationType, flowPieceUtil, FlowVersion, FlowVersionState, FlowVersionTemplate, PlatformId, sanitizeObjectForPostgresql } from '@activepieces/shared'
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

type PreparedTemplate = Omit<CreateTemplateRequestBody, 'flows'> & {
    flows: FlowVersionTemplate[]
    pieces: string[]
}

export const templateValidator = {
    async validateAndPrepare({ template, platformId, log }: ValidateParams): Promise<PreparedTemplate> {
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

        const sanitizedFlows = flows.map((flow) => sanitizeObjectForPostgresql(flow))
        const pieces = Array.from(new Set(sanitizedFlows.map((flow) => flowPieceUtil.getUsedPieces(flow.trigger)).flat()))

        return {
            ...template,
            flows: sanitizedFlows,
            pieces,
        }
    },
}

type ValidateParams = {
    template: CreateTemplateRequestBody
    platformId?: PlatformId
    log: FastifyBaseLogger
}