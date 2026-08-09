import { isNil } from '@activepieces/core-utils'
import { AgentPieceProps, FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { Migration } from '.'

export const migrateV22AgentToolConnectionById: Migration = {
    targetSchemaVersion: '22',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== '@activepieces/piece-ai' || step.settings.actionName !== 'run_agent') {
                return step
            }

            const input = step.settings.input as Record<string, unknown>
            const tools = input[AgentPieceProps.AGENT_TOOLS]
            if (!Array.isArray(tools)) {
                return step
            }

            return {
                ...step,
                settings: {
                    ...step.settings,
                    input: { ...input, [AgentPieceProps.AGENT_TOOLS]: tools.map(withConnectionById) },
                },
            }
        })
        return { ...newVersion, schemaVersion: '23' }
    },
}

function withConnectionById(tool: unknown): unknown {
    if (typeof tool !== 'object' || isNil(tool)) {
        return tool
    }
    const pieceMetadata = (tool as { pieceMetadata?: unknown }).pieceMetadata
    if (typeof pieceMetadata !== 'object' || isNil(pieceMetadata)) {
        return tool
    }
    const predefinedInput = (pieceMetadata as { predefinedInput?: unknown }).predefinedInput
    if (typeof predefinedInput !== 'object' || isNil(predefinedInput)) {
        return tool
    }
    const auth = (predefinedInput as { auth?: unknown }).auth
    const externalId = typeof auth === 'string' ? auth.match(/^\{\{connections\['([^']+)'\]\}\}$/)?.[1] : undefined
    if (isNil(externalId)) {
        return tool
    }
    return {
        ...tool,
        pieceMetadata: {
            ...pieceMetadata,
            predefinedInput: { ...predefinedInput, auth: externalId },
        },
    }
}
