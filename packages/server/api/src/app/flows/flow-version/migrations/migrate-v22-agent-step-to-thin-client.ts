import { isNil } from '@activepieces/core-utils'
import { AgentPieceProps, FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { Migration } from '.'

export const migrateV22AgentStepToThinClient: Migration = {
    targetSchemaVersion: '22',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== AGENT_PIECE_NAME || step.settings.actionName !== AGENT_ACTION_NAME) {
                return step
            }
            const input = step.settings.input as Record<string, unknown>
            const tools = input[AgentPieceProps.AGENT_TOOLS]
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: THIN_CLIENT_PIECE_VERSION,
                    input: {
                        ...input,
                        ...(Array.isArray(tools) ? { [AgentPieceProps.AGENT_TOOLS]: tools.map(withConnectionById) } : {}),
                        [AgentPieceProps.MAX_STEPS]: typeof input[AgentPieceProps.MAX_STEPS] === 'number' ? input[AgentPieceProps.MAX_STEPS] : DEFAULT_MAX_STEPS,
                    },
                },
            }
        })
        return { ...newVersion, schemaVersion: '23' }
    },
}

function withConnectionById(tool: unknown): unknown {
    if (typeof tool !== 'object' || isNil(tool) || !('pieceMetadata' in tool)) {
        return tool
    }
    const pieceMetadata = tool.pieceMetadata
    if (typeof pieceMetadata !== 'object' || isNil(pieceMetadata) || !('predefinedInput' in pieceMetadata)) {
        return tool
    }
    const predefinedInput = pieceMetadata.predefinedInput
    if (typeof predefinedInput !== 'object' || isNil(predefinedInput) || !('auth' in predefinedInput)) {
        return tool
    }
    const auth = predefinedInput.auth
    const externalId = typeof auth === 'string' ? auth.match(CONNECTION_TEMPLATE)?.[1] : undefined
    if (isNil(externalId)) {
        return tool
    }
    return {
        ...tool,
        pieceMetadata: { ...pieceMetadata, predefinedInput: { ...predefinedInput, auth: externalId } },
    }
}

const AGENT_PIECE_NAME = '@activepieces/piece-ai'
const AGENT_ACTION_NAME = 'run_agent'
const THIN_CLIENT_PIECE_VERSION = '0.6.0'
const DEFAULT_MAX_STEPS = 20
const CONNECTION_TEMPLATE = /^\{\{connections\['([^']+)'\]\}\}$/
