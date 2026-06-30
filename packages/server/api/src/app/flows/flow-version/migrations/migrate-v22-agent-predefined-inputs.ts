import {
    AgentPieceProps,
    AgentToolType,
    FieldControlMode,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    PredefinedInputsStructure,
    spreadIfDefined,
} from '@activepieces/shared'
import { Migration } from '.'

type AgentToolInput = {
    type: string
    pieceMetadata?: { predefinedInput?: Record<string, unknown>, [key: string]: unknown }
    [key: string]: unknown
}

// PR #10704 changed an agent piece tool's `predefinedInput` from a flat { auth, ...propValues } map to
// { auth?, fields: { prop: { mode, value } } } and updated the engine to read `predefinedInput.fields` — but
// shipped no migration. Flows published before that store the flat shape, so the engine sees no `fields` and
// silently drops every predefined value. Convert the flat shape so those values are read again. A present key
// in the old model meant "use this fixed value" (the agent was never asked to fill it), which maps exactly to
// CHOOSE_YOURSELF; an absent key (agent-filled) stays absent and defaults to AGENT_DECIDE at runtime.
function migratePieceToolPredefinedInput(tool: AgentToolInput): AgentToolInput {
    if (tool.type !== AgentToolType.PIECE || isNil(tool.pieceMetadata)) {
        return tool
    }
    const predefinedInput = tool.pieceMetadata.predefinedInput
    if (isNil(predefinedInput) || PredefinedInputsStructure.safeParse(predefinedInput).success) {
        return tool
    }
    const { auth, ...propValues } = predefinedInput
    const fields = Object.fromEntries(
        Object.entries(propValues).map(([propertyName, value]) => [propertyName, { mode: FieldControlMode.CHOOSE_YOURSELF, value }]),
    )
    return {
        ...tool,
        pieceMetadata: {
            ...tool.pieceMetadata,
            predefinedInput: {
                ...spreadIfDefined('auth', auth),
                fields,
            },
        },
    }
}

export const migrateV22AgentPredefinedInputs: Migration = {
    targetSchemaVersion: '22',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== '@activepieces/piece-ai' || step.settings.actionName !== 'run_agent') {
                return step
            }
            const tools = (step.settings.input?.[AgentPieceProps.AGENT_TOOLS] as AgentToolInput[] | undefined) ?? []
            return {
                ...step,
                settings: {
                    ...step.settings,
                    input: {
                        ...step.settings.input,
                        [AgentPieceProps.AGENT_TOOLS]: tools.map(migratePieceToolPredefinedInput),
                    },
                },
            }
        })
        return {
            ...newVersion,
            schemaVersion: '23',
        }
    },
}
